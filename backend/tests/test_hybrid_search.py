# backend/tests/test_hybrid_search.py
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

class TestHybridSearch(unittest.TestCase):
    """ทดสอบการค้นหาแบบ Hybrid Search"""
    
    def setUp(self):
        """เตรียมตัวแปรและข้อมูลสำหรับการทดสอบ"""
        load_dotenv()
        
        # สร้างโฟลเดอร์ทดสอบที่มีชื่อไม่ซ้ำกัน
        self.test_dir = f"./test_chroma_db_{uuid.uuid4()}"
        os.makedirs(self.test_dir, exist_ok=True)
        
        # สร้าง RAG service
        self.rag_service = AnswerEvaluationService(persist_directory=self.test_dir)
        
        # ข้อมูลทดสอบ
        self.subject_id = "TEST101"
        self.question_id = "Q1"
        
        # สร้างเอกสารตัวอย่างและเก็บลง ChromaDB
        self.create_test_documents()
    
    def tearDown(self):
        """ล้างข้อมูลหลังการทดสอบ"""
        # ลบโฟลเดอร์ทดสอบ
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def create_test_documents(self):
        """สร้างเอกสารทดสอบที่มีทั้งภาษาไทยและภาษาอังกฤษ"""
        # เนื้อหาเอกสารภาษาไทย
        thai_content = """
        หลักการ SOLID เป็นหลักการสำคัญในการออกแบบซอฟต์แวร์เชิงวัตถุ ประกอบด้วย 5 หลักการย่อย ได้แก่
        1. Single Responsibility Principle (หลักการความรับผิดชอบเดียว): คลาสควรมีเหตุผลเพียงประการเดียวในการเปลี่ยนแปลง
        2. Open-Closed Principle (หลักการเปิดและปิด): คลาสควรเปิดสำหรับการขยาย แต่ปิดสำหรับการแก้ไข
        3. Liskov Substitution Principle (หลักการแทนที่ของลิสคอฟ): คลาสย่อยควรสามารถแทนที่คลาสหลักของมันได้
        4. Interface Segregation Principle (หลักการแยกอินเทอร์เฟส): ควรแยกอินเทอร์เฟสที่มีขนาดใหญ่ให้เป็นอินเทอร์เฟสเล็กๆ
        5. Dependency Inversion Principle (หลักการกลับทิศทางการพึ่งพา): โมดูลระดับสูงไม่ควรพึ่งพาโมดูลระดับต่ำ
        """
        
        # เนื้อหาเอกสารภาษาอังกฤษ
        english_content = """
        SOLID is an acronym for five design principles in object-oriented programming:
        1. Single Responsibility Principle: A class should have only one reason to change.
        2. Open-Closed Principle: Software entities should be open for extension but closed for modification.
        3. Liskov Substitution Principle: Subtypes must be substitutable for their base types.
        4. Interface Segregation Principle: Many client-specific interfaces are better than one general-purpose interface.
        5. Dependency Inversion Principle: Depend on abstractions, not on concretions.
        """
        
        # เนื้อหาเอกสารผสม
        mixed_content = """
        Design Patterns (แบบรูปการออกแบบ) เป็นวิธีการแก้ปัญหาที่พบบ่อยในการออกแบบซอฟต์แวร์
        แบ่งเป็น 3 ประเภทหลัก ได้แก่
        1. Creational Patterns: เกี่ยวกับการสร้างออบเจกต์ เช่น Factory Method, Singleton
        2. Structural Patterns: เกี่ยวกับการจัดโครงสร้างของคลาส เช่น Adapter, Decorator
        3. Behavioral Patterns: เกี่ยวกับพฤติกรรมระหว่างออบเจกต์ เช่น Observer, Strategy
        """
        
        # สร้างเอกสาร
        documents = [
            Document(page_content=thai_content, metadata={"subject_id": self.subject_id, "question_id": self.question_id, "language": "thai"}),
            Document(page_content=english_content, metadata={"subject_id": self.subject_id, "question_id": self.question_id, "language": "english"}),
            Document(page_content=mixed_content, metadata={"subject_id": self.subject_id, "question_id": self.question_id, "language": "mixed"})
        ]
        
        # แบ่งเอกสารเป็นชิ้นเล็กๆ
        splits = self.rag_service.text_splitter.split_documents(documents)
        
        # เก็บลง ChromaDB
        collection_name = f"{self.subject_id}_{self.question_id}"
        db = self.rag_service.get_vector_store_for_question(self.subject_id, self.question_id)
        
        # เพิ่มเอกสารลงใน vector store
        db.add_documents(splits)
        
        print(f"สร้างเอกสารทดสอบสำเร็จ: {len(splits)} ชิ้น")
    
    def test_keyword_search_thai(self):
        """ทดสอบการค้นหาแบบ keyword ด้วยคำค้นหาภาษาไทย"""
        query = "หลักการออกแบบซอฟต์แวร์"
        vector_store = self.rag_service.get_vector_store_for_question(self.subject_id, self.question_id)
        
        # ทำการค้นหาแบบ keyword
        results = self.rag_service.keyword_search(
            vector_store, 
            query, 
            k=2,
            metadata_filter={"subject_id": self.subject_id, "question_id": self.question_id}
        )
        
        # ตรวจสอบผลลัพธ์
        self.assertTrue(len(results) > 0, "ไม่พบผลลัพธ์จากการค้นหาแบบ keyword ด้วยภาษาไทย")
        
        # ตรวจสอบว่าผลลัพธ์เกี่ยวข้องกับคำค้นหา
        found_relevant = False
        for doc in results:
            if "ออกแบบ" in doc.page_content and "ซอฟต์แวร์" in doc.page_content:
                found_relevant = True
                break
        
        self.assertTrue(found_relevant, "ผลลัพธ์ไม่เกี่ยวข้องกับคำค้นหาภาษาไทย")
        
        # แสดงผลลัพธ์
        print(f"ผลลัพธ์การค้นหาแบบ keyword ด้วยภาษาไทย:")
        for i, doc in enumerate(results):
            print(f"{i+1}. {doc.page_content[:100]}...")
    
    def test_keyword_search_english(self):
        """ทดสอบการค้นหาแบบ keyword ด้วยคำค้นหาภาษาอังกฤษ"""
        query = "SOLID principles object-oriented"
        vector_store = self.rag_service.get_vector_store_for_question(self.subject_id, self.question_id)
        
        # ทำการค้นหาแบบ keyword
        results = self.rag_service.keyword_search(
            vector_store, 
            query, 
            k=2,
            metadata_filter={"subject_id": self.subject_id, "question_id": self.question_id}
        )
        
        # ตรวจสอบผลลัพธ์
        self.assertTrue(len(results) > 0, "ไม่พบผลลัพธ์จากการค้นหาแบบ keyword ด้วยภาษาอังกฤษ")
        
        # ตรวจสอบว่าผลลัพธ์เกี่ยวข้องกับคำค้นหา
        found_relevant = False
        for doc in results:
            if "SOLID" in doc.page_content and "object-oriented" in doc.page_content:
                found_relevant = True
                break
        
        self.assertTrue(found_relevant, "ผลลัพธ์ไม่เกี่ยวข้องกับคำค้นหาภาษาอังกฤษ")
        
        # แสดงผลลัพธ์
        print(f"ผลลัพธ์การค้นหาแบบ keyword ด้วยภาษาอังกฤษ:")
        for i, doc in enumerate(results):
            print(f"{i+1}. {doc.page_content[:100]}...")
    
    def test_hybrid_search_with_reranking(self):
        """ทดสอบการค้นหาแบบ hybrid พร้อม re-ranking"""
        # คำค้นหาแบบผสม
        query = "Design patterns และ SOLID principles คืออะไร"
        
        # ทำการค้นหาแบบ hybrid
        results = self.rag_service.hybrid_search_with_reranking(
            query, 
            self.subject_id, 
            self.question_id, 
            k=3
        )
        
        # ตรวจสอบผลลัพธ์
        self.assertTrue(len(results) > 0, "ไม่พบผลลัพธ์จากการค้นหาแบบ hybrid")
        
        # ตรวจสอบว่าผลลัพธ์เกี่ยวข้องกับคำค้นหา (ควรมีทั้ง Design patterns และ SOLID)
        found_design_patterns = False
        found_solid = False
        
        for doc in results:
            if "Design Patterns" in doc.page_content or "แบบรูปการออกแบบ" in doc.page_content:
                found_design_patterns = True
            if "SOLID" in doc.page_content:
                found_solid = True
        
        self.assertTrue(found_design_patterns or found_solid, 
                        "ผลลัพธ์ไม่เกี่ยวข้องกับคำค้นหาแบบผสม")
        
        # แสดงผลลัพธ์
        print(f"ผลลัพธ์การค้นหาแบบ hybrid พร้อม re-ranking:")
        for i, doc in enumerate(results):
            print(f"{i+1}. {doc.page_content[:100]}...")

if __name__ == '__main__':
    unittest.main()