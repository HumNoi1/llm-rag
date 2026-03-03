import os
import re
import json
from typing import List, Optional, Dict, Any
from llama_index.core import (
    VectorStoreIndex,
    StorageContext,
    Settings,
    Document as LlamaDocument,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.groq import Groq
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from .supabase_service import SupabaseService
from ..config import (
    GROQ_API_KEY, 
    GROQ_MODEL_NAME, 
    EMBEDDING_MODEL_NAME, 
    QDRANT_URL, 
    QDRANT_API_KEY
)

class LlamaIndexService:
    def __init__(self):
        """เริ่มต้น LlamaIndex Service พร้อมโมเดลและ Vector Store"""
        self._setup_settings()
        self.qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        try:
            self.supabase_service = SupabaseService()
        except:
            self.supabase_service = None

    def _setup_settings(self):
        """ตั้งค่า Global Settings สำหรับ LlamaIndex"""
        Settings.llm = Groq(model=GROQ_MODEL_NAME, api_key=GROQ_API_KEY)
        Settings.embed_model = HuggingFaceEmbedding(model_name=EMBEDDING_MODEL_NAME)
        Settings.node_parser = SentenceSplitter(chunk_size=512, chunk_overlap=100)

    def _get_vector_store(self, collection_name: str) -> QdrantVectorStore:
        """สร้าง Qdrant Vector Store instance"""
        return QdrantVectorStore(client=self.qdrant_client, collection_name=collection_name)

    def _collection_exists(self, collection_name: str) -> bool:
        """เช็คว่ามี Collection นี้ใน Qdrant หรือยัง"""
        try:
            collections = self.qdrant_client.get_collections().collections
            return any(c.name == collection_name for c in collections)
        except:
            return False

    async def index_pdf_content(self, file_content: bytes, file_name: str, subject_id: str, question_id: str, force_reindex: bool = False):
        """สกัดข้อความจาก PDF และเก็บลง Qdrant"""
        collection_name = f"subject_{subject_id}_q_{question_id}"
        if self._collection_exists(collection_name) and not force_reindex:
            return True

        import tempfile
        import fitz
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(file_content)
                temp_path = temp_file.name
            text = ""
            with fitz.open(temp_path) as doc:
                for page in doc:
                    text += page.get_text() + f"\n\n====หน้า {page.number + 1}====\n\n"
            document = LlamaDocument(
                text=text,
                id_=f"doc_{subject_id}_{question_id}",
                metadata={"subject_id": subject_id, "question_id": question_id}
            )
            if force_reindex and self._collection_exists(collection_name):
                self.qdrant_client.delete_collection(collection_name)
            vector_store = self._get_vector_store(collection_name)
            storage_context = StorageContext.from_defaults(vector_store=vector_store)
            VectorStoreIndex.from_documents([document], storage_context=storage_context)
            return True
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

    async def evaluate_answer(self, question: str, student_answer: str, subject_id: str, question_id: str) -> dict:
        """ประเมินคำตอบและส่งคืนผลลัพธ์แบบ Structured JSON"""
        collection_name = f"subject_{subject_id}_q_{question_id}"
        if not self._collection_exists(collection_name):
            raise Exception("ไม่พบข้อมูลเฉลย")

        vector_store = self._get_vector_store(collection_name)
        index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
        query_engine = index.as_query_engine(similarity_top_k=5)
        
        prompt = self._get_structured_evaluation_prompt(question, student_answer)
        response = query_engine.query(prompt)
        
        return self._parse_json_response(str(response))

    def _get_structured_evaluation_prompt(self, question: str, student_answer: str) -> str:
        """สร้าง Prompt ที่บังคับ Output เป็น JSON"""
        return f"""
        คุณเป็นอาจารย์ผู้เชี่ยวชาญด้านวิศวกรรมซอฟต์แวร์
        ภารกิจ: ตรวจคำตอบนักศึกษาเทียบกับเฉลยใน Context และตอบกลับเป็น JSON เท่านั้น
        
        คำถาม: {question}
        คำตอบนักศึกษา: {student_answer}
        
        เกณฑ์การตรวจ (ข้อละ 2 คะแนน):
        1. ความถูกต้องของเนื้อหา (Content Accuracy)
        2. การวิเคราะห์ (Analysis)
        3. ความครบถ้วน (Completeness)
        4. ศัพท์เทคนิค (Technical Terms)
        5. การสื่อสาร (Communication)
        
        ผลลัพธ์ต้องเป็น JSON รูปแบบนี้:
        {{
            "evaluation_text": "สรุปสั้นๆ ในภาษาไทย",
            "total_score": 0.0,
            "normalized_score": 0.0,
            "details": [
                {{ "criteria": "ชื่อเกณฑ์", "score": 0.0, "reason": "เหตุผลภาษาไทย" }}
            ],
            "correct_points": ["จุดที่ตอบถูก"],
            "missing_points": ["จุดที่ขาดหรือผิด"]
        }}
        - total_score คือ คะแนนรวมเต็ม 40 (ผลรวมคะแนนดิบ 10 คะแนน คูณ 4)
        - normalized_score คือ คะแนนดิบรวมเต็ม 10
        - ห้ามมีข้อความอื่นนอกเหนือจาก JSON
        """

    def _parse_json_response(self, response_text: str) -> dict:
        """แยก JSON จากข้อความตอบกลับของ LLM"""
        try:
            # ค้นหา JSON ในข้อความ (กรณี LLM แอบใส่ข้อความอื่นมา)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return json.loads(response_text)
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            return {{
                "evaluation_text": "เกิดข้อผิดพลาดในการประมวลผลคะแนน",
                "total_score": 0.0,
                "normalized_score": 0.0,
                "details": [],
                "correct_points": [],
                "missing_points": []
            }}
