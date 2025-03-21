# backend/tests/test_pdf_multilingual.py
import os
import sys
import tempfile
import unittest
from dotenv import load_dotenv
import fitz  # PyMuPDF

# เพิ่มพาธของโปรเจกต์เพื่อให้ import โมดูลได้
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_service import AnswerEvaluationService

class TestPDFMultilingual(unittest.TestCase):
    """ทดสอบการสกัดข้อความจาก PDF ที่มีทั้งภาษาไทยและภาษาอังกฤษ"""
    
    def setUp(self):
        """เตรียมตัวแปรสำหรับการทดสอบ"""
        load_dotenv()
        self.rag_service = AnswerEvaluationService(persist_directory="./test_chroma_db")
        
        # สร้าง PDF ทดสอบแบบผสมภาษาไทยและภาษาอังกฤษ
        self.pdf_path = self.create_test_pdf_multilingual()
    
    def tearDown(self):
        """ล้างไฟล์ทดสอบหลังเสร็จสิ้น"""
        if hasattr(self, 'pdf_path') and os.path.exists(self.pdf_path):
            os.unlink(self.pdf_path)
    
    def create_test_pdf_multilingual(self):
        """สร้างไฟล์ PDF ทดสอบที่มีทั้งภาษาไทยและภาษาอังกฤษ"""
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            pdf_path = temp_file.name
        
        # สร้าง PDF โดยใช้ PyMuPDF
        doc = fitz.open()
        
        # สร้างหน้าแรกภาษาไทย
        page1 = doc.new_page()
        text1 = "หน้าที่ 1: เอกสารทดสอบภาษาไทย\n\nหลักการ SOLID เป็นหลักการในการออกแบบซอฟต์แวร์เชิงวัตถุที่ช่วยให้นักพัฒนาสร้างโค้ดที่ดี"
        page1.insert_text((50, 50), text1, fontname="helvetica", fontsize=11)
        
        # สร้างหน้าที่สองภาษาอังกฤษ
        page2 = doc.new_page()
        text2 = "Page 2: English Test Document\n\nSOLID principles are important design guidelines for object-oriented programming."
        page2.insert_text((50, 50), text2, fontname="helvetica", fontsize=11)
        
        # สร้างหน้าที่สามแบบภาษาผสม
        page3 = doc.new_page()
        text3 = "หน้าที่ 3: เอกสารผสมสองภาษา\n\nSOLID Principles ประกอบด้วย:\n1. Single Responsibility - ความรับผิดชอบเดียว\n2. Open-Closed - เปิดให้ขยาย ปิดการแก้ไข"
        page3.insert_text((50, 50), text3, fontname="helvetica", fontsize=11)
        
        # บันทึกไฟล์
        doc.save(pdf_path)
        doc.close()
        
        return pdf_path
    
    def test_extract_text_from_pdf(self):
        """ทดสอบการสกัดข้อความจาก PDF ที่มีทั้งภาษาไทยและภาษาอังกฤษ"""
        # สกัดข้อความจาก PDF
        extracted_text = self.rag_service.extract_text_from_pdf(self.pdf_path)
        
        # ตรวจสอบว่าข้อความไม่ว่างเปล่า
        self.assertTrue(len(extracted_text) > 0, "สกัดข้อความจาก PDF ไม่สำเร็จ")
        
        # ตรวจสอบว่ามีข้อความภาษาไทย
        self.assertIn("หลักการ SOLID", extracted_text, "ไม่พบข้อความภาษาไทยในผลลัพธ์")
        
        # ตรวจสอบว่ามีข้อความภาษาอังกฤษ
        self.assertIn("SOLID principles", extracted_text, "ไม่พบข้อความภาษาอังกฤษในผลลัพธ์")
        
        # ตรวจสอบว่ามีข้อความผสม
        self.assertIn("Single Responsibility - ความรับผิดชอบเดียว", extracted_text, "ไม่พบข้อความผสมในผลลัพธ์")
        
        # แสดงข้อความที่สกัดได้
        print("ข้อความที่สกัดจาก PDF:")
        print("=" * 50)
        print(extracted_text)
        print("=" * 50)
    
    def test_load_document_from_bytes(self):
        """ทดสอบการโหลดเอกสารจากไฟล์ PDF แบบไบต์"""
        # อ่านไฟล์ PDF เป็นไบต์
        with open(self.pdf_path, 'rb') as file:
            pdf_bytes = file.read()
        
        # โหลดเอกสารจากไบต์
        documents = self.rag_service.load_document_from_bytes(
            pdf_bytes, 
            "test_multilingual.pdf", 
            {"test": "metadata"}
        )
        
        # ตรวจสอบว่าได้เอกสารจริง
        self.assertTrue(len(documents) > 0, "ไม่พบเอกสารที่โหลดจากไบต์")
        
        # ตรวจสอบว่าข้อความไม่ว่างเปล่า
        self.assertTrue(len(documents[0].page_content) > 0, "เอกสารมีเนื้อหาว่างเปล่า")
        
        # ตรวจสอบว่า metadata ถูกต้อง
        self.assertEqual(documents[0].metadata["test"], "metadata", "metadata ไม่ตรงกับที่กำหนด")
        
        # ตรวจสอบว่ามีทั้งข้อความภาษาไทยและภาษาอังกฤษ
        has_thai = any("หลักการ" in doc.page_content for doc in documents)
        has_english = any("SOLID principles" in doc.page_content for doc in documents)
        
        self.assertTrue(has_thai, "ไม่พบข้อความภาษาไทยในเอกสาร")
        self.assertTrue(has_english, "ไม่พบข้อความภาษาอังกฤษในเอกสาร")
        
        # แสดงรายละเอียดเอกสาร
        print(f"จำนวนเอกสารที่โหลด: {len(documents)}")
        print(f"ตัวอย่างเนื้อหา: {documents[0].page_content[:200]}...")

if __name__ == '__main__':
    unittest.main()