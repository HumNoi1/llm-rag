# backend/tests/test_pdf_integration.py
import os
import sys
import unittest
import time
import uuid
import tempfile
import subprocess
import signal
import requests
import fitz  # PyMuPDF
from pathlib import Path
from dotenv import load_dotenv

# เพิ่มพาธของโปรเจกต์เพื่อให้ import โมดูลได้
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# โหลดตัวแปรสภาพแวดล้อม
load_dotenv()

# กำหนดค่าคงที่สำหรับการทดสอบ
API_URL = "http://localhost:8000"
TEST_SUBJECT_ID = f"PDF_TEST_{uuid.uuid4().hex[:8]}"  # สร้าง ID ไม่ซ้ำกัน
TEST_QUESTION_ID = "Q1"

# กำหนดเนื้อหาทดสอบ
TEST_ANSWER_KEY = """
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

TEST_STUDENT_ANSWER = """
หลักการ SOLID ประกอบด้วย 5 หลักการดังนี้:
1. S - Single Responsibility คือคลาสควรมีหน้าที่เดียว
2. O - Open/Closed คือเปิดให้ขยาย ปิดให้แก้ไข
3. L - Liskov Substitution คือคลาสลูกต้องแทนที่คลาสแม่ได้
4. I - Interface Segregation คือแยกอินเทอร์เฟซให้เฉพาะ
5. D - Dependency Inversion คือขึ้นต่อนามธรรมไม่ใช่รูปธรรม
"""

TEST_QUESTION = "อธิบายหลักการ SOLID ในการออกแบบซอฟต์แวร์"

class APIServer:
    """คลาสสำหรับจัดการ API Server ในการทดสอบ"""
    
    @staticmethod
    def start():
        """เริ่มต้น FastAPI server สำหรับทดสอบ"""
        # หาพาธของไฟล์ main.py
        backend_dir = Path(__file__).parent.parent
        main_path = backend_dir / "app" / "main.py"
        
        print(f"กำลังเริ่มต้น FastAPI server ที่ {main_path}...")
        
        # เริ่ม API server ด้วย uvicorn
        if os.name == 'nt':  # Windows
            process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", f"app.main:app", "--host", "0.0.0.0", "--port", "8000"],
                cwd=str(backend_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:  # Linux/Unix
            process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", f"app.main:app", "--host", "0.0.0.0", "--port", "8000"],
                cwd=str(backend_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid
            )
        
        # รอให้ server เริ่มต้น
        time.sleep(5)
        
        return process
    
    @staticmethod
    def stop(process):
        """หยุดการทำงานของ FastAPI server"""
        print("กำลังหยุด FastAPI server...")
        
        if os.name == 'nt':  # Windows
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:  # Linux/Unix
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        
        # รอให้โปรเซสปิดตัว
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        
        print("หยุด FastAPI server เรียบร้อยแล้ว")

class PDFTestHelper:
    """คลาสช่วยเหลือสำหรับการสร้างและจัดการไฟล์ PDF"""
    
    @staticmethod
    def create_pdf_file(content, title="เอกสารทดสอบ"):
        """สร้างไฟล์ PDF จากเนื้อหาข้อความ"""
        # สร้างไฟล์ PDF ชั่วคราว
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            pdf_path = temp_file.name
        
        # สร้างเอกสาร PDF
        doc = fitz.open()
        
        # สร้างหน้าแรกสำหรับหัวข้อ
        title_page = doc.new_page()
        title_page.insert_text((50, 100), title, fontsize=16, fontname="helvetica")
        title_page.insert_text((50, 130), f"สร้างเมื่อ: {time.strftime('%Y-%m-%d %H:%M:%S')}", fontsize=10)
        
        # สร้างหน้าเนื้อหา
        content_page = doc.new_page()
        
        # เพิ่มข้อความลงในหน้า
        font_size = 11
        y_position = 50
        for line in content.split('\n'):
            if line.strip():
                content_page.insert_text((50, y_position), line, fontsize=font_size, fontname="helvetica")
                y_position += font_size + 5
            else:
                # ในกรณีบรรทัดว่าง ให้เพิ่มระยะห่างขึ้น
                y_position += 10
        
        # บันทึกไฟล์ PDF
        doc.save(pdf_path)
        doc.close()
        
        return pdf_path
    
    @staticmethod
    def extract_text_from_pdf(pdf_path):
        """สกัดข้อความจากไฟล์ PDF"""
        text = ""
        
        # เปิดเอกสาร PDF
        doc = fitz.open(pdf_path)
        
        # สกัดข้อความจากทุกหน้า
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text("text")
            text += page_text + "\n\n"
        
        # ปิดเอกสาร
        doc.close()
        
        return text

class PDFIntegrationTest(unittest.TestCase):
    """การทดสอบการอัปโหลดและประมวลผลไฟล์ PDF"""
    
    @classmethod
    def setUpClass(cls):
        """เตรียมสภาพแวดล้อมก่อนทำการทดสอบทั้งหมด"""
        print("\n=== เริ่มการทดสอบการทำงานกับไฟล์ PDF ===\n")
        cls.api_process = APIServer.start()
        
        # รอและตรวจสอบว่า API พร้อมใช้งาน
        max_attempts = 10
        for attempt in range(max_attempts):
            try:
                response = requests.get(f"{API_URL}/")
                if response.status_code == 200:
                    print(f"API พร้อมใช้งาน: {response.json()['message']}")
                    break
            except Exception:
                pass
                
            if attempt < max_attempts - 1:
                print(f"รอ API เริ่มต้น... (ครั้งที่ {attempt + 1}/{max_attempts})")
                time.sleep(2)
            else:
                raise Exception("ไม่สามารถเชื่อมต่อกับ API ได้หลังจากพยายามหลายครั้ง")
    
    @classmethod
    def tearDownClass(cls):
        """ทำความสะอาดหลังทำการทดสอบทั้งหมด"""
        if hasattr(cls, 'api_process'):
            APIServer.stop(cls.api_process)
        print("\n=== การทดสอบการทำงานกับไฟล์ PDF เสร็จสิ้น ===")
    
    def test_01_create_and_read_pdf(self):
        """ทดสอบการสร้างและอ่านไฟล์ PDF"""
        print("\n=== ทดสอบการสร้างและอ่านไฟล์ PDF ===")
        
        # สร้างไฟล์ PDF
        pdf_path = PDFTestHelper.create_pdf_file(
            content=TEST_ANSWER_KEY,
            title="เฉลยหลักการออกแบบซอฟต์แวร์"
        )
        
        try:
            # ตรวจสอบว่าไฟล์ถูกสร้างขึ้นจริง
            self.assertTrue(os.path.exists(pdf_path), "ไฟล์ PDF ไม่ถูกสร้าง")
            
            # อ่านข้อความจากไฟล์ PDF
            extracted_text = PDFTestHelper.extract_text_from_pdf(pdf_path)
            
            # ตรวจสอบว่ามีเนื้อหาสำคัญในไฟล์
            self.assertIn("SOLID", extracted_text, "ไม่พบเนื้อหา SOLID ในไฟล์ PDF")
            self.assertIn("Single Responsibility", extracted_text, "ไม่พบเนื้อหา Single Responsibility ในไฟล์ PDF")
            
            print(f"สร้างและอ่านไฟล์ PDF สำเร็จ: {pdf_path}")
            
        finally:
            # ลบไฟล์ PDF
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
    
    def test_02_upload_pdf_answer_key(self):
        """ทดสอบการอัปโหลดเฉลยในรูปแบบ PDF"""
        print("\n=== ทดสอบการอัปโหลดเฉลยในรูปแบบ PDF ===")
        
        # สร้างไฟล์ PDF
        pdf_path = PDFTestHelper.create_pdf_file(
            content=TEST_ANSWER_KEY,
            title="เฉลยหลักการออกแบบซอฟต์แวร์"
        )
        
        try:
            # ส่งคำขออัปโหลดไฟล์
            with open(pdf_path, 'rb') as f:
                files = {'file': (os.path.basename(pdf_path), f, 'application/pdf')}
                data = {'subject_id': TEST_SUBJECT_ID, 'question_id': TEST_QUESTION_ID}
                
                response = requests.post(f"{API_URL}/api/evaluation/upload-answer-key", files=files, data=data)
            
            self.assertEqual(response.status_code, 200, f"อัปโหลดเฉลย PDF ไม่สำเร็จ: {response.text}")
            result = response.json()
            
            # ตรวจสอบผลลัพธ์
            self.assertIn("message", result, "ไม่พบข้อความยืนยันการอัปโหลด")
            self.assertEqual(result['subject_id'], TEST_SUBJECT_ID, "รหัสวิชาไม่ตรงกัน")
            self.assertEqual(result['question_id'], TEST_QUESTION_ID, "รหัสคำถามไม่ตรงกัน")
            self.assertEqual(result['file_type'], "PDF", "ประเภทไฟล์ไม่ตรงกัน")
            
            print(f"ผลลัพธ์: {result['message']}")
            print(f"จำนวนชั้นส่วนข้อมูล (chunks): {result['chunks']}")
            
        finally:
            # ลบไฟล์ PDF
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
    
    def test_03_evaluate_with_pdf_answer_key(self):
        """ทดสอบการประเมินคำตอบกับเฉลยในรูปแบบ PDF"""
        print("\n=== ทดสอบการประเมินคำตอบกับเฉลยในรูปแบบ PDF ===")
        
        # ข้อมูลสำหรับการประเมิน
        eval_data = {
            "question": TEST_QUESTION,
            "student_answer": TEST_STUDENT_ANSWER,
            "subject_id": TEST_SUBJECT_ID,
            "question_id": TEST_QUESTION_ID
        }
        
        # ส่งคำขอประเมินคำตอบ
        response = requests.post(f"{API_URL}/api/evaluation/evaluate", json=eval_data)
        
        self.assertEqual(response.status_code, 200, f"ประเมินคำตอบไม่สำเร็จ: {response.text}")
        result = response.json()
        
        # ตรวจสอบผลลัพธ์
        self.assertIn("evaluation", result, "ไม่พบผลการประเมิน")
        self.assertIn("score", result, "ไม่พบคะแนน")
        self.assertGreaterEqual(result["score"], 0, "คะแนนต้องไม่น้อยกว่า 0")
        self.assertLessEqual(result["score"], 10, "คะแนนต้องไม่มากกว่า 10")
        self.assertEqual(result["subject_id"], TEST_SUBJECT_ID, "รหัสวิชาไม่ตรงกัน")
        self.assertEqual(result["question_id"], TEST_QUESTION_ID, "รหัสคำถามไม่ตรงกัน")
        
        print(f"คะแนน: {result['score']}/10")
        
        # แสดงส่วนต้นของการประเมิน (เพื่อไม่ให้ยาวเกินไป)
        eval_text = result['evaluation']
        if len(eval_text) > 300:
            print(f"การประเมิน (บางส่วน): {eval_text[:300]}...")
        else:
            print(f"การประเมิน: {eval_text}")
    
    def test_04_complex_pdf_with_formatting(self):
        """ทดสอบการอัปโหลด PDF ที่มีการจัดรูปแบบซับซ้อน"""
        print("\n=== ทดสอบการอัปโหลด PDF ที่มีการจัดรูปแบบซับซ้อน ===")
        
        # สร้างเนื้อหาที่มีการจัดรูปแบบหลากหลาย
        complex_content = """
        การออกแบบซอฟต์แวร์: แนวคิดและหลักการสำคัญ
        ==================================================
        
        บทนำ:
        การออกแบบซอฟต์แวร์ที่ดีช่วยให้ระบบมีความเข้าใจง่าย บำรุงรักษาง่าย และขยายตัวได้ในอนาคต
        
        ส่วนที่ 1: หลักการ SOLID
        --------------------------------------------------
        1.1 Single Responsibility Principle (SRP)
            * คลาสควรมีหน้าที่รับผิดชอบเพียงหนึ่งอย่างเท่านั้น
            * หนึ่งคลาสควรมีเหตุผลในการเปลี่ยนแปลงเพียงหนึ่งเดียว
            
        1.2 Open/Closed Principle (OCP)
            * เปิดให้ขยายได้ แต่ปิดไม่ให้มีการแก้ไข
            * ควรสามารถเพิ่มความสามารถใหม่โดยไม่ต้องแก้ไขโค้ดเดิม
            
        1.3 Liskov Substitution Principle (LSP)
            * คลาสลูกควรแทนที่คลาสแม่ได้โดยไม่ทำให้ระบบผิดพลาด
            * คลาสลูกต้องทำงานได้เหมือนกับคลาสแม่ในบริบทเดียวกัน
            
        1.4 Interface Segregation Principle (ISP)
            * อินเทอร์เฟซควรเล็กและเฉพาะเจาะจง
            * คลาสไม่ควรถูกบังคับให้ใช้เมธอดที่ไม่จำเป็น
            
        1.5 Dependency Inversion Principle (DIP)
            * คลาสควรขึ้นอยู่กับนามธรรม ไม่ใช่รูปธรรม
            * โมดูลระดับสูงไม่ควรขึ้นกับโมดูลระดับต่ำ
            
        ส่วนที่ 2: หลักการออกแบบอื่นๆ
        --------------------------------------------------
        2.1 DRY (Don't Repeat Yourself)
            * ลดความซ้ำซ้อนของโค้ด
            * ความรู้ในระบบควรมีเพียงหนึ่งเดียวและชัดเจน
            
        2.2 KISS (Keep It Simple, Stupid)
            * ทำให้ระบบเรียบง่ายที่สุดเท่าที่จะเป็นไปได้
            * หลีกเลี่ยงความซับซ้อนที่ไม่จำเป็น
        """
        
        # สร้างไฟล์ PDF
        pdf_path = PDFTestHelper.create_pdf_file(
            content=complex_content,
            title="การออกแบบซอฟต์แวร์: แนวคิดและหลักการสำคัญ"
        )
        
        try:
            # ส่งคำขออัปโหลดไฟล์
            complex_subject_id = f"COMPLEX_PDF_{uuid.uuid4().hex[:8]}"
            
            with open(pdf_path, 'rb') as f:
                files = {'file': (os.path.basename(pdf_path), f, 'application/pdf')}
                data = {'subject_id': complex_subject_id, 'question_id': TEST_QUESTION_ID}
                
                response = requests.post(f"{API_URL}/api/evaluation/upload-answer-key", files=files, data=data)
            
            self.assertEqual(response.status_code, 200, f"อัปโหลดเฉลย PDF ซับซ้อนไม่สำเร็จ: {response.text}")
            result = response.json()
            
            # ตรวจสอบผลลัพธ์
            self.assertEqual(result['file_type'], "PDF", "ประเภทไฟล์ไม่ตรงกัน")
            print(f"ผลลัพธ์: {result['message']}")
            print(f"จำนวนชั้นส่วนข้อมูล (chunks): {result['chunks']}")
            
            # ทดสอบการประเมินด้วย PDF ที่ซับซ้อน
            eval_data = {
                "question": "อธิบายหลักการ SOLID และหลักการออกแบบอื่นๆ",
                "student_answer": """
                หลักการออกแบบซอฟต์แวร์ที่สำคัญประกอบด้วยหลักการ SOLID ได้แก่
                1. Single Responsibility - คลาสควรมีหน้าที่เดียว
                2. Open/Closed - เปิดให้ขยาย ปิดไม่ให้แก้ไข
                3. Liskov Substitution - คลาสลูกแทนที่คลาสแม่ได้
                4. Interface Segregation - อินเทอร์เฟซควรเล็กและเฉพาะเจาะจง
                5. Dependency Inversion - พึ่งพานามธรรมแทนรูปธรรม
                
                นอกจากนี้ยังมีหลักการสำคัญอื่นๆ เช่น
                - DRY (Don't Repeat Yourself) ลดความซ้ำซ้อนของโค้ด
                - KISS (Keep It Simple) ทำให้ระบบเรียบง่าย
                """,
                "subject_id": complex_subject_id,
                "question_id": TEST_QUESTION_ID
            }
            
            eval_response = requests.post(f"{API_URL}/api/evaluation/evaluate", json=eval_data)
            self.assertEqual(eval_response.status_code, 200, f"ประเมินคำตอบไม่สำเร็จ: {eval_response.text}")
            eval_result = eval_response.json()
            
            print(f"คะแนนจากเฉลย PDF ซับซ้อน: {eval_result['score']}/10")
            
        finally:
            # ลบไฟล์ PDF
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)

if __name__ == "__main__":
    unittest.main()