# backend/tests/test_reranking.py
import os
import sys
import unittest
import uuid
import shutil
from dotenv import load_dotenv

# เพิ่มพาธของโปรเจกต์เพื่อให้ import โมดูลได้
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_service import AnswerEvaluationService
from langchain_core.documents import Document

class TestReranking(unittest.TestCase):
    """ทดสอบการจัดอันดับผลลัพธ์ใหม่ (Re-ranking)"""
    
    def setUp(self):
        """เตรียมตัวแปรและข้อมูลสำหรับการทดสอบ"""
        load_dotenv()
        
        # สร้างโฟลเดอร์ทดสอบที่มีชื่อไม่ซ้ำกัน
        self.test_dir = f"./test_chroma_db_{uuid.uuid4()}"
        os.makedirs(self.test_dir, exist_ok=True)
        
        # สร้าง RAG service
        self.rag_service = AnswerEvaluationService(persist_directory=self.test_dir)
    
    def tearDown(self):
        """ล้างข้อมูลหลังการทดสอบ"""
        # ลบโฟลเดอร์ทดสอบ
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def test_reranking_thai_documents(self):
        """ทดสอบการจัดอันดับใหม่กับเอกสารภาษาไทย"""
        # สร้างชุดเอกสารทดสอบภาษาไทย
        documents = [
            Document(page_content="SOLID เป็นหลักการออกแบบซอฟต์แวร์เชิงวัตถุ ประกอบด้วย 5 หลักการ"),
            Document(page_content="การทดสอบซอฟต์แวร์แบ่งออกเป็นหลายระดับ ได้แก่ Unit Testing, Integration Testing"),
            Document(page_content="Single Responsibility Principle คือหลักการที่คลาสควรมีเหตุผลเพียงประการเดียวในการเปลี่ยนแปลง"),
            Document(page_content="Open-Closed Principle คือหลักการที่เอนทิตีของซอฟต์แวร์ควรเปิดให้ขยายได้ แต่ปิดให้แก้ไข"),
            Document(page_content="การใช้ Design Patterns ช่วยให้นักพัฒนาแก้ปัญหาทั่วไปได้อย่างมีประสิทธิภาพ")
        ]
        
        # คำค้นหาภาษาไทย
        query = "หลักการ Single Responsibility คืออะไร"
        
        # จัดอันดับใหม่
        reranked_results = self.rag_service.rerank_results(query, documents, top_k=3)
        
        # ตรวจสอบว่าได้ผลลัพธ์
        self.assertEqual(len(reranked_results), 3, "จำนวนผลลัพธ์ไม่ตรงกับที่กำหนด (top_k=3)")
        
        # ตรวจสอบว่าเอกสารที่เกี่ยวข้องกับ Single Responsibility ควรอยู่ลำดับต้นๆ
        found_at_top = "Single Responsibility" in reranked_results[0].page_content
        
        self.assertTrue(found_at_top, 
                        "เอกสารที่เกี่ยวข้องกับ Single Responsibility ไม่ได้อยู่ในลำดับต้น")
        
        # แสดงผลลัพธ์
        print("ผลลัพธ์หลังการจัดอันดับใหม่ (คำค้นหาภาษาไทย):")
        for i, doc in enumerate(reranked_results):
            print(f"{i+1}. {doc.page_content}")
    
    def test_reranking_english_documents(self):
        """ทดสอบการจัดอันดับใหม่กับเอกสารภาษาอังกฤษ"""
        # สร้างชุดเอกสารทดสอบภาษาอังกฤษ
        documents = [
            Document(page_content="SOLID is an acronym for five design principles in object-oriented programming."),
            Document(page_content="Software testing can be done at different levels: unit testing, integration testing."),
            Document(page_content="The Single Responsibility Principle states that a class should have only one reason to change."),
            Document(page_content="The Open-Closed Principle states that software entities should be open for extension but closed for modification."),
            Document(page_content="Design patterns are typical solutions to common problems in software design.")
        ]
        
        # คำค้นหาภาษาอังกฤษ
        query = "What is the Single Responsibility Principle?"
        
        # จัดอันดับใหม่
        reranked_results = self.rag_service.rerank_results(query, documents, top_k=3)
        
        # ตรวจสอบว่าได้ผลลัพธ์
        self.assertEqual(len(reranked_results), 3, "จำนวนผลลัพธ์ไม่ตรงกับที่กำหนด (top_k=3)")
        
        # ตรวจสอบว่าเอกสารที่เกี่ยวข้องกับ Single Responsibility ควรอยู่ลำดับต้นๆ
        found_at_top = "Single Responsibility" in reranked_results[0].page_content
        
        self.assertTrue(found_at_top, 
                        "เอกสารที่เกี่ยวข้องกับ Single Responsibility ไม่ได้อยู่ในลำดับต้น")
        
        # แสดงผลลัพธ์
        print("ผลลัพธ์หลังการจัดอันดับใหม่ (คำค้นหาภาษาอังกฤษ):")
        for i, doc in enumerate(reranked_results):
            print(f"{i+1}. {doc.page_content}")
    
    def test_reranking_mixed_documents(self):
        """ทดสอบการจัดอันดับใหม่กับเอกสารผสมภาษา"""
        # สร้างชุดเอกสารทดสอบผสมภาษา
        documents = [
            Document(page_content="SOLID is an acronym for five design principles in object-oriented programming."),
            Document(page_content="หลักการ Open-Closed คือหลักการที่เอนทิตีของซอฟต์แวร์ควรเปิดให้ขยายได้ แต่ปิดให้แก้ไข"),
            Document(page_content="The Single Responsibility Principle states that a class should have only one reason to change."),
            Document(page_content="หลักการ Single Responsibility คือหลักการที่คลาสควรมีเหตุผลเพียงประการเดียวในการเปลี่ยนแปลง"),
            Document(page_content="Design patterns are typical solutions to common problems in software design.")
        ]
        
        # คำค้นหาผสมภาษา
        query = "อธิบาย Single Responsibility Principle"
        
        # จัดอันดับใหม่
        reranked_results = self.rag_service.rerank_results(query, documents, top_k=3)
        
        # ตรวจสอบว่าได้ผลลัพธ์
        self.assertEqual(len(reranked_results), 3, "จำนวนผลลัพธ์ไม่ตรงกับที่กำหนด (top_k=3)")
        
        # ตรวจสอบว่าเอกสารที่เกี่ยวข้องกับ Single Responsibility ควรอยู่ลำดับต้นๆ
        relevant_at_top = any("Single Responsibility" in doc.page_content for doc in reranked_results[:2])
        
        self.assertTrue(relevant_at_top, 
                        "เอกสารที่เกี่ยวข้องกับ Single Responsibility ไม่ได้อยู่ในลำดับต้น")
        
        # แสดงผลลัพธ์
        print("ผลลัพธ์หลังการจัดอันดับใหม่ (คำค้นหาผสมภาษา):")
        for i, doc in enumerate(reranked_results):
            print(f"{i+1}. {doc.page_content}")

if __name__ == '__main__':
    unittest.main()