# backend/app/services/model_service.py
from langchain_groq import ChatGroq
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document
from typing import List, Dict, Any
from ..config import GROQ_API_KEY, GROQ_MODEL_NAME, EMBEDDING_MODEL_NAME

class ModelService:
    """
    ให้บริการโมเดล AI สำหรับ LLM (Groq) และ Embeddings (Hugging Face)
    """
    
    def __init__(self):
        # สร้าง LLM instance โดยใช้ Groq API
        self.llm = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name=GROQ_MODEL_NAME,
            temperature=0.1,  # ตั้งค่า temperature ต่ำเพื่อให้คำตอบแน่นอนมากขึ้น
            max_tokens=4096,
        )
        
        # สร้าง Embeddings instance โดยใช้โมเดลจาก Hugging Face
        # ในที่นี้เราเลือกใช้ multilingual-e5-large ซึ่งรองรับภาษาไทยด้วย
        self.embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": "cpu"},  # เปลี่ยนเป็น "cuda" ถ้ามี GPU
            encode_kwargs={"normalize_embeddings": True}
        )
    
    def get_llm(self):
        """
        ดึง LLM instance
        """
        return self.llm
    
    def get_embeddings(self):
        """
        ดึง Embeddings instance
        """
        return self.embeddings