# backend/tests/test_llm_service.py
import os
import shutil
from dotenv import load_dotenv
from app.services.rag_service import AnswerEvaluationService
from app.services.llm_service import LLMEvaluationService

# โหลดตัวแปรสภาพแวดล้อมจาก .env
load_dotenv()

TEST_DB_PATH = "./test_chroma_db"

def test_llm_service():
    """ทดสอบการทำงานของ LLM Service"""
    
    # ลบฐานข้อมูลทดสอบเก่าถ้ามี
    if os.path.exists(TEST_DB_PATH):
        shutil.rmtree(TEST_DB_PATH)
    
    # สร้าง RAG Service
    rag_service = AnswerEvaluationService(persist_directory=TEST_DB_PATH)
    
    # สร้าง LLM Service
    llm_service = LLMEvaluationService(rag_service)
    
    # ทดสอบการ Index เฉลย
    answer_key = """
    แนวคิดการออกแบบซอฟต์แวร์ที่ดี (Good Software Design Principles):
    
    1. หลักการ SOLID:
       - Single Responsibility Principle: คลาสควรมีหน้าที่รับผิดชอบเพียงอย่างเดียว
       - Open/Closed Principle: ซอฟต์แวร์ควรเปิดให้ขยายได้ แต่ปิดการแก้ไข
       - Liskov Substitution Principle: คลาสลูกควรแทนที่คลาสแม่ได้โดยไม่มีปัญหา
       - Interface Segregation Principle: อินเทอร์เฟซควรเฉพาะเจาะจงกับผู้ใช้
       - Dependency Inversion Principle: เชื่อมต่อกับนามธรรม ไม่ใช่คลาสจริง
       
    2. หลักการออกแบบอื่นๆ:
       - DRY (Don't Repeat Yourself): ลดการซ้ำซ้อนของโค้ด
       - KISS (Keep It Simple, Stupid): รักษาความเรียบง่าย
       - YAGNI (You Aren't Gonna Need It): ไม่ควรเพิ่มฟีเจอร์ที่ยังไม่จำเป็น
    """
    
    subject_id = "CS101"
    question_id = "Q1"
    
    chunks = rag_service.index_answer_key(answer_key, subject_id, question_id)
    print(f"Indexed answer key with {chunks} chunks")
    
    # กำหนดคำถามและคำตอบนักเรียน
    question = "อธิบายหลักการ SOLID ในการออกแบบซอฟต์แวร์"
    student_answer = """
    หลักการ SOLID ประกอบด้วย
    1. S - Single Responsibility คือคลาสควรมีหน้าที่เดียว
    2. O - Open/Closed คือเปิดให้ขยาย ปิดให้แก้ไข
    3. L - Liskov คือคลาสลูกต้องแทนที่คลาสแม่ได้
    4. I - Interface Segregation คือแยกอินเทอร์เฟซให้เฉพาะ
    5. D - Dependency Inversion คือขึ้นต่อนามธรรมไม่ใช่รูปธรรม
    """
    
    # ประเมินคำตอบ
    print("\nEvaluating student answer...")
    result = llm_service.evaluate_answer(question, student_answer, subject_id, question_id)
    
    # แสดงผลลัพธ์
    print("\nEvaluation Result:")
    print(f"Score: {result['score']}")
    print(f"Evaluation: {result['evaluation']}")
    
    # ลบฐานข้อมูลทดสอบ
    if os.path.exists(TEST_DB_PATH):
        shutil.rmtree(TEST_DB_PATH)
    
if __name__ == "__main__":
    test_llm_service()