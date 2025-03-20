# backend/tests/test_pythainlp.py
import os
import sys
import unittest
from dotenv import load_dotenv

# เพิ่มพาธของโปรเจกต์เพื่อให้ import โมดูลได้
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_service import AnswerEvaluationService

class TestPyThaiNLP(unittest.TestCase):
    """ทดสอบการใช้งาน PyThaiNLP ในระบบ RAG"""
    
    def setUp(self):
        """เตรียมตัวแปรสำหรับการทดสอบ"""
        load_dotenv()
        self.rag_service = AnswerEvaluationService(persist_directory="./test_chroma_db")
    
    def test_extract_keywords_thai(self):
        """ทดสอบการสกัดคำสำคัญจากข้อความภาษาไทย"""
        # ข้อความภาษาไทยล้วนๆ
        thai_text = """
        หลักการ SOLID เป็นหลักการในการออกแบบซอฟต์แวร์เชิงวัตถุที่ช่วยให้นักพัฒนาสร้างโค้ดที่มีความยืดหยุ่น 
        บำรุงรักษาง่าย และขยายได้ หลักการนี้ประกอบด้วย 5 หลักการย่อย ได้แก่ 
        Single Responsibility Principle, Open-Closed Principle, Liskov Substitution Principle, 
        Interface Segregation Principle และ Dependency Inversion Principle
        """
        
        keywords = self.rag_service.extract_keywords(thai_text)
        
        # ตรวจสอบว่าได้คำสำคัญจริง
        self.assertTrue(len(keywords) > 0, "ไม่พบคำสำคัญในข้อความภาษาไทย")
        
        # ตรวจสอบว่ามีคำสำคัญที่คาดหวังอยู่ในผลลัพธ์
        expected_keywords = ["หลักการ", "ออกแบบ", "ซอฟต์แวร์", "SOLID"]
        for keyword in expected_keywords:
            self.assertIn(keyword, keywords, f"ไม่พบคำสำคัญ '{keyword}' ในผลลัพธ์")
        
        # แสดงคำสำคัญที่สกัดได้
        print(f"คำสำคัญจากข้อความภาษาไทย: {keywords}")
    
    def test_extract_keywords_english(self):
        """ทดสอบการสกัดคำสำคัญจากข้อความภาษาอังกฤษ"""
        # ข้อความภาษาอังกฤษล้วนๆ
        english_text = """
        The SOLID principles are a set of five design principles in object-oriented programming
        that make software designs more understandable, flexible, and maintainable.
        These principles include Single Responsibility, Open-Closed, Liskov Substitution,
        Interface Segregation, and Dependency Inversion.
        """
        
        keywords = self.rag_service.extract_keywords(english_text)
        
        # ตรวจสอบว่าได้คำสำคัญจริง
        self.assertTrue(len(keywords) > 0, "ไม่พบคำสำคัญในข้อความภาษาอังกฤษ")
        
        # ตรวจสอบว่ามีคำสำคัญที่คาดหวังอยู่ในผลลัพธ์
        expected_keywords = ["SOLID", "principles", "design", "object", "programming"]
        for keyword in expected_keywords:
            self.assertIn(keyword, keywords, f"ไม่พบคำสำคัญ '{keyword}' ในผลลัพธ์")
        
        # แสดงคำสำคัญที่สกัดได้
        print(f"คำสำคัญจากข้อความภาษาอังกฤษ: {keywords}")
    
    def test_extract_keywords_mixed(self):
        """ทดสอบการสกัดคำสำคัญจากข้อความผสมภาษาไทยและอังกฤษ"""
        # ข้อความผสมภาษาไทยและอังกฤษ
        mixed_text = """
        หลักการ SOLID (SOLID Principles) เป็นหลักการสำคัญในการออกแบบซอฟต์แวร์ 
        ประกอบด้วย Single Responsibility คือทุกคลาสควรมีหน้าที่เดียว 
        Open-Closed คือเปิดให้เพิ่มความสามารถแต่ปิดไม่ให้แก้ไขโค้ดเดิม 
        Liskov Substitution คือคลาสลูกต้องแทนที่คลาสแม่ได้ 
        Interface Segregation คือควรแยกอินเทอร์เฟซให้เล็กและเฉพาะเจาะจง 
        และ Dependency Inversion คือควรพึ่งพานามธรรมแทนที่จะเป็นคลาสจริงๆ
        """
        
        keywords = self.rag_service.extract_keywords(mixed_text)
        
        # ตรวจสอบว่าได้คำสำคัญจริง
        self.assertTrue(len(keywords) > 0, "ไม่พบคำสำคัญในข้อความผสม")
        
        # ตรวจสอบว่ามีคำสำคัญที่คาดหวังอยู่ในผลลัพธ์ (ทั้งภาษาไทยและอังกฤษ)
        expected_thai = ["หลักการ", "ออกแบบ", "ซอฟต์แวร์"]
        expected_english = ["SOLID", "Principles", "Responsibility"]
        
        for keyword in expected_thai + expected_english:
            self.assertIn(keyword, keywords, f"ไม่พบคำสำคัญ '{keyword}' ในผลลัพธ์")
        
        # แสดงคำสำคัญที่สกัดได้
        print(f"คำสำคัญจากข้อความผสม: {keywords}")
    
    def test_stopwords_removal(self):
        """ทดสอบการลบ stopwords ภาษาไทยและอังกฤษ"""
        text = "นี่คือการทดสอบการลบคำที่ไม่มีความหมายเชิงเนื้อหา เช่น นี่ คือ การ ที่ แต่ this is a test of stopwords removal"
        
        keywords = self.rag_service.extract_keywords(text)
        
        # คำที่ไม่ควรอยู่ในผลลัพธ์ (stopwords)
        thai_stopwords = ["นี่", "คือ", "การ", "ที่", "แต่"]
        eng_stopwords = ["this", "is", "a", "of"]
        
        for word in thai_stopwords + eng_stopwords:
            self.assertNotIn(word, keywords, f"พบ stopword '{word}' ในผลลัพธ์")
        
        # แสดงคำสำคัญที่สกัดได้
        print(f"คำสำคัญหลังจากลบ stopwords: {keywords}")

if __name__ == '__main__':
    unittest.main()