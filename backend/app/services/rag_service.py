# backend/app/services/rag_service.py
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.documents import Document
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
        
    def index_answer_key(self, answer_key_content, subject_id, question_id):
        """
        เก็บเอกสารเฉลยในฐานข้อมูล ChromaDB
        
        Args:
            answer_key_content: เนื้อหาของเฉลย
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            
        Returns:
            จำนวนชิ้นส่วนที่แบ่งได้
        """
        # สร้างเอกสารจากเฉลย
        documents = [
            Document(
                page_content=answer_key_content,
                metadata={
                    "type": "answer_key",
                    "subject_id": subject_id,
                    "question_id": question_id
                }
            )
        ]
        
        # แบ่งเอกสารเป็นส่วนย่อย
        splits = self.text_splitter.split_documents(documents)
        
        # สร้าง collection ใหม่สำหรับคำถามนี้
        collection_name = f"{subject_id}_{question_id}"
        
        # ใช้ ChromaDB เพื่อเก็บข้อมูล
        # ถ้า collection มีอยู่แล้ว ให้ลบแล้วสร้างใหม่
        db = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
            collection_name=collection_name,
        )
        
        #ตรวจสอบก่อนว่ามีเมธอด persist หรือไม่
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