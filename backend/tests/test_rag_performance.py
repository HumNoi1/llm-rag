# backend/tests/test_rag_performance.py
import os
import sys
import unittest
import uuid
import shutil
import time
from dotenv import load_dotenv

# เพิ่มพาธของโปรเจกต์เพื่อให้ import โมดูลได้
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_service import AnswerEvaluationService
from app.services.llm_service import LLMEvaluationService
from app.services.model_service import ModelService

class TestRAGPerformance(unittest.TestCase):
    """ทดสอบประสิทธิภาพโดยรวมของระบบ RAG"""
    
    @classmethod
    def setUpClass(cls):
        """เตรียมตัวแปรและข้อมูลสำหรับการทดสอบครั้งเดียว"""
        load_dotenv()
        
        # สร้างโฟลเดอร์ทดสอบที่มีชื่อไม่ซ้ำกัน
        cls.test_dir = f"./test_chroma_db_{uuid.uuid4()}"
        os.makedirs(cls.test_dir, exist_ok=True)
        
        # สร้างบริการต่างๆ
        cls.rag_service = AnswerEvaluationService(persist_directory=cls.test_dir)
        cls.model_service = ModelService()
        cls.llm_service = LLMEvaluationService(cls.rag_service)
        
        # ข้อมูลทดสอบ
        cls.subject_id = "TEST101"
        cls.question_id = "Q1"
        
        # ใส่ข้อมูลตัวอย่างลงใน RAG
        answer_key = """
        # หลักการออกแบบซอฟต์แวร์ (Software Design Principles)

        ## หลักการ SOLID
        SOLID เป็นหลักการในการออกแบบซอฟต์แวร์เชิงวัตถุ ประกอบด้วย 5 หลักการย่อย:

        1. **Single Responsibility Principle (หลักการความรับผิดชอบเดียว)**
           - คลาสควรมีเหตุผลเพียงประการเดียวในการเปลี่ยนแปลง
           - แต่ละคลาสควรทำหน้าที่เพียงอย่างเดียว ไม่ควรรวมหน้าที่หลายอย่างไว้ในคลาสเดียวกัน

        2. **Open-Closed Principle (หลักการเปิดและปิด)**
           - คลาสควรเปิดสำหรับการขยาย แต่ปิดสำหรับการแก้ไข
           - เราควรสามารถเพิ่มความสามารถให้คลาสได้โดยไม่ต้องแก้ไขโค้ดเดิม

        3. **Liskov Substitution Principle (หลักการแทนที่ของลิสคอฟ)**
           - คลาสย่อยควรสามารถแทนที่คลาสหลักของมันได้
           - คลาสลูกต้องไม่เปลี่ยนแปลงพฤติกรรมของคลาสแม่ที่ถูกกำหนดไว้ในสัญญา (contract)

        4. **Interface Segregation Principle (หลักการแยกอินเทอร์เฟส)**
           - ควรแยกอินเทอร์เฟสที่มีขนาดใหญ่ให้เป็นอินเทอร์เฟสเล็กๆ ที่เฉพาะเจาะจง
           - คลาสไม่ควรถูกบังคับให้พึ่งพาเมธอดที่มันไม่ได้ใช้

        5. **Dependency Inversion Principle (หลักการกลับทิศทางการพึ่งพา)**
           - โมดูลระดับสูงไม่ควรพึ่งพาโมดูลระดับต่ำ ทั้งคู่ควรพึ่งพานามธรรม
           - นามธรรมไม่ควรพึ่งพารายละเอียด รายละเอียดควรพึ่งพานามธรรม

        ## รูปแบบการออกแบบ (Design Patterns)
        Design Patterns เป็นวิธีการแก้ปัญหาที่พบบ่อยในการออกแบบซอฟต์แวร์ แบ่งเป็น 3 ประเภทหลัก:

        1. **Creational Patterns**
           - เกี่ยวกับการสร้างออบเจกต์
           - ตัวอย่าง: Factory Method, Abstract Factory, Singleton, Builder, Prototype

        2. **Structural Patterns**
           - เกี่ยวกับการจัดโครงสร้างของคลาส
           - ตัวอย่าง: Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy

        3. **Behavioral Patterns**
           - เกี่ยวกับพฤติกรรมระหว่างออบเจกต์
           - ตัวอย่าง: Chain of Responsibility, Command, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor
        """
        
        cls.rag_service.index_answer_key(answer_key, cls.subject_id, cls.question_id)
        print("ตั้งค่าการทดสอบเสร็จสมบูรณ์")
    
    @classmethod
    def tearDownClass(cls):
        """ล้างข้อมูลหลังการทดสอบเสร็จสิ้น"""
        # ลบโฟลเดอร์ทดสอบ
        if os.path.exists(cls.test_dir):
            shutil.rmtree(cls.test_dir)
    
    def test_rag_retrieval_comparison(self):
        """เปรียบเทียบประสิทธิภาพระหว่างวิธีค้นหาต่างๆ"""
        # คำค้นหาทดสอบ
        query = "อธิบายหลักการ Single Responsibility และ Open-Closed"
        
        # เก็บผลลัพธ์จากวิธีการค้นหาแบบต่างๆ
        results = {}
        
        # 1. การค้นหาแบบ semantic ปกติ
        start_time = time.time()
        vector_store = self.rag_service.get_vector_store_for_question(self.subject_id, self.question_id)
        semantic_results = vector_store.similarity_search(query, k=3)
        semantic_time = time.time() - start_time
        results["semantic"] = {
            "results": semantic_results,
            "time": semantic_time
        }
        
        # 2. การค้นหาแบบ keyword
        start_time = time.time()
        keyword_results = self.rag_service.keyword_search(
            vector_store, 
            query, 
            k=3,
            metadata_filter={"subject_id": self.subject_id, "question_id": self.question_id}
        )
        keyword_time = time.time() - start_time
        results["keyword"] = {
            "results": keyword_results,
            "time": keyword_time
        }
        
        # 3. การค้นหาแบบ hybrid
        start_time = time.time()
        hybrid_results = self.rag_service.hybrid_search_with_reranking(
            query, 
            self.subject_id, 
            self.question_id, 
            k=3
        )
        hybrid_time = time.time() - start_time
        results["hybrid"] = {
            "results": hybrid_results,
            "time": hybrid_time
        }
        
        # แสดงผลการเปรียบเทียบ
        print("\n=== เปรียบเทียบประสิทธิภาพระหว่างวิธีค้นหาต่างๆ ===")
        print(f"คำค้นหา: '{query}'")
        print("-" * 50)
        
        for method, data in results.items():
            print(f"วิธีการค้นหา: {method}")
            print(f"เวลาที่ใช้: {data['time']:.4f} วินาที")
            print("ตัวอย่างผลลัพธ์:")
            for i, doc in enumerate(data["results"][:2]):  # แสดงแค่ 2 ผลลัพธ์แรก
                print(f"  {i+1}. {doc.page_content[:100]}...")
            print("-" * 50)
        
        # ตรวจสอบว่าเวลาไม่เกินกว่าที่ยอมรับได้
        self.assertLess(hybrid_time, 5.0, "การค้นหาแบบ hybrid ใช้เวลานานเกินไป")
        
        # ตรวจสอบว่ามีผลลัพธ์เกี่ยวข้องกับคำค้นหา
        for method, data in results.items():
            found_relevant = False
            for doc in data["results"]:
                if "Single Responsibility" in doc.page_content and "Open-Closed" in doc.page_content:
                    found_relevant = True
                    break
            
            self.assertTrue(found_relevant, f"ไม่พบผลลัพธ์ที่เกี่ยวข้องในวิธีการค้นหาแบบ {method}")
    
    def test_end_to_end_evaluation(self):
        """ทดสอบการทำงานตั้งแต่ต้นจนจบของระบบ"""
        # กำหนดคำถามและคำตอบของนักเรียน
        question = "อธิบายหลักการออกแบบซอฟต์แวร์ SOLID พร้อมยกตัวอย่างการนำไปใช้"
        student_answer = """
        หลักการ SOLID เป็นหลักการสำคัญในการออกแบบซอฟต์แวร์ ประกอบด้วย
        1. S (Single Responsibility): คลาสควรมีหน้าที่เดียว เช่น แยกคลาส UserManager จากคลาส FileManager
        2. O (Open-Closed): ควรเปิดให้ขยายแต่ปิดการแก้ไข เช่น ใช้ interfaces แทนการแก้ไขคลาสเดิม
        3. L (Liskov Substitution): คลาสลูกควรแทนคลาสแม่ได้ เช่น คลาส Square ควรแทนคลาส Rectangle ได้
        4. I (Interface Segregation): ควรแยกอินเทอร์เฟสให้เล็กลง เช่น แยก Printable จาก Scannable
        5. D (Dependency Inversion): ควรพึ่งพาการนามธรรม เช่น พึ่งพา interfaces แทนคลาสที่เป็นรูปธรรม
        """
        
        # ทดสอบประเมินคำตอบ
        start_time = time.time()
        result = self.llm_service.evaluate_answer(
            question=question,
            student_answer=student_answer,
            subject_id=self.subject_id,
            question_id=self.question_id
        )
        eval_time = time.time() - start_time
        
        # แสดงผลการประเมิน
        print("\n=== ผลการประเมินคำตอบนักเรียน ===")
        print(f"เวลาที่ใช้: {eval_time:.2f} วินาที")
        print(f"คะแนน: {result['score']}/10")
        print("การประเมิน:")
        print(result['evaluation'])
        
        # ตรวจสอบว่าผลลัพธ์มีรูปแบบที่ถูกต้อง
        self.assertIn("คะแนน", result['evaluation'], "ไม่พบคำว่า 'คะแนน' ในผลการประเมิน")
        self.assertTrue(0 <= result['score'] <= 10, "คะแนนไม่อยู่ในช่วง 0-10")
        
        # ตรวจสอบว่ามีการประเมินครบทุกส่วน
        self.assertIn("จุดเด่น", result['evaluation'], "ไม่พบการประเมินจุดเด่น")
        self.assertIn("ข้อเสนอแนะ", result['evaluation'], "ไม่พบข้อเสนอแนะ")

if __name__ == '__main__':
    unittest.main()