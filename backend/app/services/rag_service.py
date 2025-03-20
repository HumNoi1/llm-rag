# backend/app/services/rag_service.py
import os
import tempfile
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_community.document_loaders import TextLoader
from .model_service import ModelService
from ..config import CHROMA_DB_DIRECTORY

class AnswerEvaluationService:
    def __init__(self, persist_directory=CHROMA_DB_DIRECTORY):
        """
        เริ่มต้นบริการประเมินคำตอบด้วย ChromaDB และ AI Models
        
        Args:
            persist_directory: โฟลเดอร์ที่ใช้เก็บข้อมูล ChromaDB
        """
        # สร้างโฟลเดอร์สำหรับเก็บข้อมูลถ้ายังไม่มี
        os.makedirs(persist_directory, exist_ok=True)
        
        # ดึงโมเดล embeddings จาก ModelService
        self.model_service = ModelService()
        self.embeddings = self.model_service.get_embeddings()
        
        self.persist_directory = persist_directory
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True,
            # ใช้ตัวคั่นภาษาไทยเพิ่มเติม
            separators=["\n\n", "\n", " ", "", ".", "?", "!", ":", ";", "—", "–"]
        )
        
    def extract_text_from_pdf(self, file_path):
        """
        สกัดข้อความจากไฟล์ PDF โดยใช้ PyMuPDF (fitz)
        
        Args:
            file_path: พาธของไฟล์ PDF
            
        Returns:
            ข้อความที่สกัดได้จาก PDF
        """
        text = ""
        
        # เปิดเอกสาร PDF
        doc = fitz.open(file_path)
        
        # สกัดข้อความจากทุกหน้า
        for page_num in range(len(doc)):
            page = doc[page_num]
            text += page.get_text() + "\n\n"
            
        # ปิดเอกสาร
        doc.close()
        
        return text
        
    def load_document_from_bytes(self, file_content, file_name, metadata=None):
        """
        โหลดเอกสารจากข้อมูลไบต์ของไฟล์
        
        Args:
            file_content: เนื้อหาของไฟล์ในรูปแบบไบต์
            file_name: ชื่อไฟล์
            metadata: ข้อมูลเมตาดาต้าเพิ่มเติม
            
        Returns:
            เอกสารที่โหลดได้
        """
        if metadata is None:
            metadata = {}

        # สร้างไฟล์ชั่วคราว
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1]) as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name
            
        try:
            # ตรวจสอบประเภทไฟล์
            if file_name.lower().endswith(".pdf"):
                # สกัดข้อความจาก PDF ด้วย PyMuPDF
                text_content = self.extract_text_from_pdf(temp_path)
                
                # สร้างเอกสารเพียงอันเดียวที่มีข้อความทั้งหมด
                documents = [
                    Document(
                        page_content=text_content,
                        metadata={**metadata, "source": file_name}
                    )
                ]
                
                return documents
            else:
                # สำหรับไฟล์ข้อความปกติ
                loader = TextLoader(temp_path)
                documents = loader.load()
                
                # เพิ่มเมตาดาต้าให้กับทุกเอกสาร
                for doc in documents:
                    doc.metadata.update(metadata)
                
                return documents
        finally:
            # ลบไฟล์ชั่วคราว
            os.unlink(temp_path)
        
    def index_answer_key(self, answer_key_content, subject_id, question_id, file_name=None):
        """
        เก็บเอกสารเฉลยในฐานข้อมูล ChromaDB
        
        Args:
            answer_key_content: เนื้อหาของเฉลย
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            file_name: ชื่อไฟล์ (ถ้ามี)
            
        Returns:
            จำนวนชิ้นส่วนที่แบ่งได้
        """
        # สร้าง metadata
        metadata = {
            "type": "answer_key",
            "subject_id": subject_id,
            "question_id": question_id
        }
        
        # โหลดเอกสาร
        if file_name and isinstance(answer_key_content, bytes):
            # กรณีเป็นไฟล์ PDF หรือไฟล์อื่นๆ
            documents = self.load_document_from_bytes(answer_key_content, file_name, metadata)
        else:
            # กรณีป็นข้อความธรรมดา
            if isinstance(answer_key_content, bytes):
                answer_key_content = answer_key_content.decode("utf-8")
                
            documents = [
                Document(
                    page_content=answer_key_content,
                    metadata=metadata
                )
            ]
        
        # แบ่งเอกสารเป็นส่วนย่อย - Text Splitting
        splits = self.text_splitter.split_documents(documents)
        
        # สร้าง collection ใหม่สำหรับคำถามนี้
        collection_name = f"{subject_id}_{question_id}"
        
        # ใช้ ChromaDB เก็บข้อมูล - Embedding และบันทึกลง Chroma
        db = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
            collection_name=collection_name
        )
        
        # ตรวจสอบก่อนว่ามีเมธอด persist หรือไม่
        if hasattr(db, 'persist'):
            # เรียกใช้เมธอด persist ถ้ามี
            db.persist()
        
        return len(splits)
    
    def get_vector_store_for_question(self, subject_id, question_id):
        """
        ดึง vector store สำหรับคำถามที่ต้องการ
        
        Args:
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            
        Returns:
            Chroma vector store ของคำถามนั้น
        """
        collection_name = f"{subject_id}_{question_id}"
        
        return Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name=collection_name
        )
    
    def retrieve_relevant_context(self, query, subject_id, question_id, k=4):
        """
        ค้นหาข้อมูลที่เกี่ยวข้องจากเฉลย
        
        Args:
            query: คำถามหรือคำตอบที่ต้องการค้นหาบริบทที่เกี่ยวข้อง
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            k: จำนวนเอกสารที่ต้องการค้นหา
            
        Returns:
            เอกสารที่เกี่ยวข้อง
        """
        vector_store = self.get_vector_store_for_question(subject_id, question_id)
        return vector_store.similarity_search(query, k=k)