# backend/app/services/model_service.py
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.schema import Document
from typing import List, Dict, Any
from ..config import GROQ_API_KEY, GROQ_MODEL_NAME, EMBEDDING_MODEL_NAME

class ModelService:
    """
    ให้บริการโมเดล AI สำหรับ LLM (Groq) และ Embeddings (Hugging Face)
    """
    
    def __init__(self):
        """เริ่มต้น ModelService โดยโหลดโมเดล LLM และ Embeddings"""
        self._initialize_models()
    
    def _initialize_models(self):
        """โหลดและตั้งค่าโมเดล LLM และ Embeddings"""
        self._initialize_llm()
        self._initialize_embeddings()
    
    def _initialize_llm(self):
        """
        เตรียม LLM จาก Groq
        """
        self.llm = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name=GROQ_MODEL_NAME,
            temperature=0.1,  # ตั้งค่า temperature ต่ำเพื่อให้คำตอบแน่นอนมากขึ้น
            max_tokens=4096,
        )
    
    def _initialize_embeddings(self):
        """
        เตรียม Embeddings model จาก Hugging Face
        """
        self.embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": "cpu"},  # เปลี่ยนเป็น "cuda" ถ้ามี GPU
            encode_kwargs={"normalize_embeddings": True}
        )
    
    def get_llm(self):
        """
        ดึง LLM instance
        
        Returns:
            LLM instance
        """
        return self.llm
    
    def get_embeddings(self):
        """
        ดึง Embeddings instance
        
        Returns:
            Embeddings instance
        """
        return self.embeddings