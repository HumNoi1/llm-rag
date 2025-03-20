# backend/app/services/rag_service.py
import os
import tempfile
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_community.document_loaders import TextLoader
from sentence_transformers import CrossEncoder  # สำหรับ re-ranking
from pythainlp.tokenize import word_tokenize
from pythainlp.util import dict_trie
from pythainlp.corpus.common import thai_words
from pythainlp.corpus import thai_stopwords
import re
from typing import List, Dict, Any, Optional, Set
import re
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
        chunk_size=500,
            chunk_overlap=100,
            length_function=len,
            add_start_index=True,
            # ลำดับความสำคัญของตัวคั่น (เพิ่มตัวคั่นภาษาไทย)
            separators=[
                # ตัวคั่นระดับเอกสาร
                "==== หน้า ",
                "\n\n",
                # ตัวคั่นระดับย่อหน้า
                "\n",
                # ตัวคั่นระดับประโยค
                ". ", "? ", "! ",
                # ตัวคั่นภาษาไทย
                "   ", " ", 
                # ตัวคั่นภาษาไทย
                "เรื่อง", "บท", "หัวข้อ", "ตอน",
                # ตัวคั่นทั่วไป
                ".", "?", "!", ":", ";", "—", "–",
                # ไม่มีตัวคั่นเลย
                ""
            ]
        )
        
        # เพิ่ม Cross-Encoder สำหรับ re-ranking
        try:
            # ใช้โมเดลขนาดเล็กเพื่อความเร็วในการทำงาน 
            # แต่สามารถเปลี่ยนเป็นโมเดลที่ใหญ่ขึ้นเพื่อความแม่นยำสูงขึ้นได้
            self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-TinyBERT-L-2-v2')
        except Exception as e:
            print(f"Warning: Could not load Cross-Encoder model: {str(e)}")
            # กำหนดให้เป็น None ในกรณีที่โหลดไม่สำเร็จ
            self.cross_encoder = None
        
    def extract_text_from_pdf(self, file_path: str) -> str:
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
            page_text = page.get_text("text")
            text += page_text + "\n\n====หน้า " + str(page_num + 1) + "====\n\n"
            
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
            # กรณีเป็นข้อความธรรมดา
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

    def extract_keywords(self, text: str) -> List[str]:
        """
        สกัดคำสำคัญจากข้อความโดยรองรับทั้งภาษาไทยและภาษาอังกฤษ
        
        Args:
            text: ข้อความที่ต้องการสกัดคำสำคัญ
                
        Returns:
            รายการคำสำคัญ
        """
        # ลบช่องว่างที่ไม่จำเป็น
        text = ' '.join(text.split())
        
        # ตั้งค่าคำ stopwords ภาษาไทย (คำที่ไม่มีความหมายเชิงเนื้อหา)
        thai_stop = list(thai_stopwords())
        eng_stop = ['a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 
                    'as', 'what', 'when', 'where', 'how', 'who', 'which']
        
        # สร้าง custom dictionary
        custom_dict = dict_trie(thai_words())
        
        # ตัดคำภาษาไทยด้วย PyThaiNLP
        tokens = word_tokenize(text, engine='newmm', custom_dict=custom_dict)
        
        # กรองคำ stopwords และคำที่สั้นเกินไป
        keywords = []
        for token in tokens:
            # กรองคำว่าง ตัวเลข และเครื่องหมายวรรคตอน
            if (token.strip() and 
                not token.isspace() and 
                not token.isdigit() and 
                not re.match(r'^[^\w\s\u0E00-\u0E7F]+$', token) and
                len(token) >= 2):
                
                # ตรวจสอบว่าเป็นคำ stopwords หรือไม่
                if token.lower() not in thai_stop and token.lower() not in eng_stop:
                    keywords.append(token)
        
        # กำจัดคำซ้ำ
        return list(set(keywords))
    
    def keyword_search(self, vector_store, query: str, k: int = 4, metadata_filter: Optional[Dict[str, Any]] = None):
        """
        ทำการค้นหาแบบ keyword-based โดยรองรับภาษาไทย
        
        Args:
            vector_store: Vector store ที่ต้องการค้นหา
            query: คำค้นหา
            k: จำนวนผลลัพธ์ที่ต้องการ
            metadata_filter: ตัวกรองตาม metadata
            
        Returns:
            ผลลัพธ์จากการค้นหา
        """
        # สกัดคำสำคัญจากคำค้นหาด้วย PyThaiNLP
        keywords = self.extract_keywords(query)
        
        # สร้างคำค้นหาแบบใหม่โดยเน้นคำสำคัญ
        # ใช้การเชื่อมด้วย OR เพื่อให้หาเอกสารที่มีคำใดคำหนึ่ง
        keyword_query = " OR ".join(keywords) if keywords else query
        
        try:
            # ทำการค้นหาด้วย keyword_query และ filter ที่กำหนด
            return vector_store.similarity_search(
                keyword_query, 
                k=k,
                filter=metadata_filter
            )
        except Exception as e:
            print(f"Keyword search error: {str(e)}")
            # ถ้ามีข้อผิดพลาด ให้ลองใช้คำค้นหาเดิม
            return vector_store.similarity_search(query, k=k, filter=metadata_filter)

    def rerank_results(self, query: str, documents: List[Document], top_k: int = 4):
        """
        จัดลำดับผลลัพธ์ใหม่ด้วย Cross-Encoder
        
        Args:
            query: คำค้นหา
            documents: เอกสารที่ต้องการจัดลำดับใหม่
            top_k: จำนวนผลลัพธ์ที่ต้องการหลังจัดลำดับใหม่
            
        Returns:
            เอกสารที่ผ่านการจัดลำดับใหม่
        """
        # ตรวจสอบกรณีที่ไม่มีเอกสาร
        if not documents:
            return []
        
        # ตรวจสอบว่ามีโมเดล cross-encoder หรือไม่
        if self.cross_encoder is None:
            # ถ้าไม่มี cross-encoder ให้คืนเอกสารเดิมเรียงตามลำดับ
            return documents[:top_k]
        
        # สร้างคู่ (query, passage) สำหรับการประเมิน
        pairs = [(query, doc.page_content) for doc in documents]
        
        try:
            # ทำนายคะแนนความเกี่ยวข้อง
            scores = self.cross_encoder.predict(pairs)
            
            # จับคู่เอกสารกับคะแนน
            scored_documents = list(zip(documents, scores))
            
            # เรียงลำดับตามคะแนน (มากไปน้อย)
            sorted_documents = sorted(scored_documents, key=lambda x: x[1], reverse=True)
            
            # ตัดเฉพาะ top_k เอกสาร
            reranked_documents = [doc for doc, _ in sorted_documents[:top_k]]
            
            return reranked_documents
        except Exception as e:
            print(f"Re-ranking error: {str(e)}")
            # ถ้ามีข้อผิดพลาด ให้คืนเอกสารเดิมเรียงตามลำดับ
            return documents[:top_k]
    
    def hybrid_search_with_reranking(self, query: str, subject_id: str, question_id: str, k: int = 4):
        """
        ทำ hybrid search และ re-ranking
        
        Args:
            query: คำค้นหา
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            k: จำนวนผลลัพธ์ที่ต้องการ
            
        Returns:
            เอกสารที่ผ่านการค้นหาและจัดลำดับใหม่
        """
        vector_store = self.get_vector_store_for_question(subject_id, question_id)
        
        # กำหนด metadata filter
        metadata_filter = {"subject_id": subject_id, "question_id": question_id}
        
        try:
            # 1. ค้นหาด้วย semantic search (ขยายจำนวนผลลัพธ์เป็น 2 เท่า)
            semantic_results = vector_store.similarity_search(
                query, 
                k=k*2,
                filter=metadata_filter
            )
        except Exception as e:
            print(f"Semantic search error: {str(e)}")
            semantic_results = []
        
        try:
            # 2. ค้นหาด้วย keyword search (ขยายจำนวนผลลัพธ์เป็น 2 เท่า)
            keyword_results = self.keyword_search(
                vector_store,
                query,
                k=k*2,
                metadata_filter=metadata_filter
            )
        except Exception as e:
            print(f"Keyword search error: {str(e)}")
            keyword_results = []
        
        # 3. รวมผลลัพธ์เข้าด้วยกันและกำจัดความซ้ำซ้อน
        combined_results = []
        seen_contents = set()
        
        for doc in semantic_results + keyword_results:
            if doc.page_content not in seen_contents:
                combined_results.append(doc)
                seen_contents.add(doc.page_content)
        
        # กรณีไม่พบผลลัพธ์ใดๆ
        if not combined_results:
            return []
        
        # 4. จัดลำดับผลลัพธ์ใหม่ด้วย cross-encoder
        reranked_results = self.rerank_results(query, combined_results, top_k=k)
        
        return reranked_results
    
    def retrieve_relevant_context(self, query, subject_id, question_id, k=4):
        """
        ค้นหาข้อมูลที่เกี่ยวข้องจากเฉลยด้วย hybrid search และ re-ranking
        
        Args:
            query: คำถามหรือคำตอบที่ต้องการค้นหาบริบทที่เกี่ยวข้อง
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            k: จำนวนเอกสารที่ต้องการค้นหา
            
        Returns:
            เอกสารที่เกี่ยวข้อง
        """
        try:
            # ใช้การค้นหาแบบผสมและจัดลำดับใหม่
            return self.hybrid_search_with_reranking(query, subject_id, question_id, k=k)
        except Exception as e:
            print(f"Error in retrieve_relevant_context: {str(e)}")
            # กรณีเกิดข้อผิดพลาด ย้อนกลับไปใช้วิธีดั้งเดิม
            vector_store = self.get_vector_store_for_question(subject_id, question_id)
            return vector_store.similarity_search(query, k=k)