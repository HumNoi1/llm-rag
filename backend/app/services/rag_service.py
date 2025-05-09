# backend/app/services/rag_service.py
import os
import tempfile
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.documents import Document
from typing import List, Dict, Any, Optional
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
        
        # เตรียม services และ models
        self._setup_services(persist_directory)
        
    def _setup_services(self, persist_directory):
        """
        เตรียม services และตัวแบ่งข้อความ
        
        Args:
            persist_directory: โฟลเดอร์ที่ใช้เก็บข้อมูล ChromaDB
        """
        # ดึงโมเดล embeddings จาก ModelService
        self.model_service = ModelService()
        self.embeddings = self.model_service.get_embeddings()
        
        self.persist_directory = persist_directory
        self.text_splitter = self._create_text_splitter()
    
    def _create_text_splitter(self):
        """
        สร้างตัวแบ่งข้อความสำหรับแบ่งเอกสารเป็นชิ้นเล็กๆ
        
        Returns:
            RecursiveCharacterTextSplitter สำหรับแบ่งเอกสาร
        """
        return RecursiveCharacterTextSplitter(
            chunk_size=350,
            chunk_overlap=150,
            length_function=len,
            add_start_index=True,
            separators=[
                "==== หน้า ",
                "\n\n",
                "\n",
                ". ", "? ", "! ",
                "   ", " ",
                ".", "?", "!", ":", ";", "—", "–",
                ""
            ]
        )
        
    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        สกัดข้อความจากไฟล์ PDF
        
        Args:
            file_path: พาธของไฟล์ PDF
            
        Returns:
            ข้อความที่สกัดได้จาก PDF
        """
        text = ""
        
        # ใช้ with statement เพื่อจัดการทรัพยากรอย่างมีประสิทธิภาพ
        with fitz.open(file_path) as doc:
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text("text")
                text += page_text + f"\n\n====หน้า {page_num + 1}====\n\n"
        
        return text
        
    def load_pdf_document(self, file_content, file_name, metadata=None):
        """
        โหลดเอกสารจากข้อมูลไบต์ของไฟล์ PDF
        
        Args:
            file_content: เนื้อหาของไฟล์ในรูปแบบไบต์
            file_name: ชื่อไฟล์
            metadata: ข้อมูลเมตาดาต้าเพิ่มเติม
            
        Returns:
            เอกสารที่โหลดได้
        """
        metadata = metadata or {}
        temp_path = None

        try:
            # สร้างไฟล์ชั่วคราว
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(file_content)
                temp_path = temp_file.name
            
            # สกัดข้อความจาก PDF
            text_content = self.extract_text_from_pdf(temp_path)
            
            # สร้างเอกสาร
            return [
                Document(
                    page_content=text_content,
                    metadata={**metadata, "source": file_name}
                )
            ]
        finally:
            # ลบไฟล์ชั่วคราวหลังใช้งาน
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
        
    def index_answer_key(self, answer_key_content, subject_id, question_id, file_name=None):
        """
        เก็บเอกสารเฉลยในฐานข้อมูล ChromaDB
        
        Args:
            answer_key_content: เนื้อหาของเฉลย (ไฟล์ PDF)
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            file_name: ชื่อไฟล์ (ถ้ามี)
            
        Returns:
            จำนวนชิ้นส่วนที่แบ่งได้
        """
        self._validate_pdf_file(file_name)
        
        # สร้าง metadata และโหลดเอกสาร
        metadata = self._create_answer_metadata(subject_id, question_id)
        documents = self.load_pdf_document(answer_key_content, file_name, metadata)
        
        # แบ่งเอกสารและบันทึกลง ChromaDB
        return self._split_and_store_documents(documents, subject_id, question_id)
    
    def _validate_pdf_file(self, file_name):
        """
        ตรวจสอบว่าไฟล์เป็น PDF หรือไม่
        
        Args:
            file_name: ชื่อไฟล์ที่ต้องการตรวจสอบ
            
        Raises:
            ValueError: ถ้าไฟล์ไม่ใช่ PDF
        """
        if file_name and not file_name.lower().endswith('.pdf'):
            raise ValueError("รองรับเฉพาะไฟล์ PDF เท่านั้น")
    
    def _create_answer_metadata(self, subject_id, question_id):
        """
        สร้าง metadata สำหรับเอกสารเฉลย
        
        Args:
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            
        Returns:
            metadata dictionary
        """
        return {
            "type": "answer_key",
            "subject_id": subject_id,
            "question_id": question_id
        }
    
    def _split_and_store_documents(self, documents, subject_id, question_id):
        """
        แบ่งเอกสารเป็นส่วนย่อยและบันทึกลง ChromaDB
        
        Args:
            documents: เอกสารที่ต้องการแบ่ง
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            
        Returns:
            จำนวนชิ้นส่วนที่แบ่งได้
        """
        # แบ่งเอกสารเป็นส่วนย่อย
        splits = self.text_splitter.split_documents(documents)
        
        # สร้าง collection name และบันทึกลง ChromaDB
        collection_name = f"{subject_id}_{question_id}"
        db = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
            collection_name=collection_name
        )
        
        # บันทึกลงดิสก์ถ้าเป็นไปได้
        if hasattr(db, 'persist'):
            db.persist()
        
        return len(splits)
    
    def get_vector_store_for_question(self, subject_id, question_id):
        """
        ดึง vector store สำหรับคำถาม
        
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
            query: คำถามหรือคำตอบที่ต้องการค้นหาบริบท
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            k: จำนวนเอกสารที่ต้องการค้นหา
            
        Returns:
            เอกสารที่เกี่ยวข้อง
        """
        # ดึง vector store
        vector_store = self.get_vector_store_for_question(subject_id, question_id)
        
        # สร้าง metadata filter
        metadata_filter = self._create_metadata_filter(subject_id, question_id)
        
        # ค้นหาด้วย fallback
        return self._search_with_fallback(vector_store, query, k, metadata_filter)
    
    def _create_metadata_filter(self, subject_id, question_id):
        """
        สร้าง metadata filter สำหรับการค้นหา
        
        Args:
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            
        Returns:
            metadata filter dictionary
        """
        return {
            "$and": [
                {"subject_id": {"$eq": subject_id}},
                {"question_id": {"$eq": question_id}}
            ]
        }
    
    def _search_with_fallback(self, vector_store, query, k, metadata_filter=None):
        """
        ค้นหาข้อมูลด้วย filter และมี fallback กรณีเกิดข้อผิดพลาด
        
        Args:
            vector_store: Chroma vector store
            query: คำถามหรือคำตอบ
            k: จำนวนเอกสารที่ต้องการค้นหา
            metadata_filter: filter สำหรับค้นหา
            
        Returns:
            เอกสารที่เกี่ยวข้อง
        """
        try:
            # ลองค้นหาด้วย filter ก่อน
            return vector_store.similarity_search(query, k=k, filter=metadata_filter)
        except Exception as e:
            print(f"Error in similarity search with filter: {str(e)}")
            
            try:
                # ถ้าเกิดข้อผิดพลาด ให้ลองค้นหาโดยไม่ใช้ filter
                return vector_store.similarity_search(query, k=k)
            except Exception as e2:
                print(f"Error in fallback similarity search: {str(e2)}")
            return []

    async def load_pdf_from_url(self, file_content: bytes, file_name: str, metadata=None):
        """
        โหลดเอกสารจากเนื้อหาไฟล์ที่ดาวน์โหลดจาก URL
        
        Args:
            file_content: เนื้อหาของไฟล์ในรูปแบบไบต์
            file_name: ชื่อไฟล์
            metadata: ข้อมูลเมตาดาต้าเพิ่มเติม
            
        Returns:
            เอกสารที่โหลดได้
        """
        return self.load_pdf_document(file_content, file_name, metadata)

    async def index_answer_key_from_url(self, answer_key_content: bytes, file_name: str, subject_id: str, question_id: str):
        """
        เก็บเอกสารเฉลยจากไฟล์ที่ดาวน์โหลดจาก URL ในฐานข้อมูล ChromaDB
        
        Args:
            answer_key_content: เนื้อหาของเฉลย (ไฟล์ PDF)
            file_name: ชื่อไฟล์
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            
        Returns:
            จำนวนชิ้นส่วนที่แบ่งได้
        """
        self._validate_pdf_file(file_name)
        
        # สร้าง metadata และโหลดเอกสาร
        metadata = self._create_answer_metadata(subject_id, question_id)
        documents = await self.load_pdf_from_url(answer_key_content, file_name, metadata)
        
        # แบ่งเอกสารและบันทึกลง ChromaDB
        return self._split_and_store_documents(documents, subject_id, question_id)