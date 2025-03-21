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
import re
import json
from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, Any, List, Tuple
import textwrap

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

TEST_STUDENT_ANSWER_INCOMPLETE = """
หลักการออกแบบซอฟต์แวร์ที่สำคัญประกอบด้วย
1. Single Responsibility: หนึ่งคลาสทำหนึ่งหน้าที่
2. Open/Closed: เปิดให้ขยาย ปิดให้แก้ไข
3. LSP: คลาสลูกแทนคลาสแม่ได้

และยังมีหลักการอื่นๆ เช่น DRY คือไม่เขียนโค้ดซ้ำซ้อน
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

class EvaluationAnalyzer:
    """คลาสสำหรับวิเคราะห์และแสดงผลการประเมิน"""
    
    @staticmethod
    def parse_evaluation(evaluation_text: str) -> Dict[str, Any]:
        """
        แยกวิเคราะห์ข้อความการประเมินจาก LLM เพื่อดึงส่วนต่างๆ ออกมา
        
        Args:
            evaluation_text: ข้อความผลการประเมินจาก LLM
            
        Returns:
            Dictionary ที่มีส่วนต่างๆ ของการประเมิน
        """
        result = {
            "score": None,
            "strengths": [],
            "weaknesses": [],
            "suggestions": [],
            "raw_text": evaluation_text
        }
        
        # ดึงคะแนนออกมาจากข้อความ
        score_match = re.search(r'คะแนน:\s*(\d+(?:\.\d+)?)/10', evaluation_text)
        if score_match:
            result["score"] = float(score_match.group(1))
        
        # ดึงจุดเด่น จุดอ่อน และข้อเสนอแนะออกมาจากข้อความ
        
        # วิธีที่ 1: หาหัวข้อที่เกี่ยวกับจุดเด่น
        strengths_patterns = [
            r'จุดเด่น(?:ของคำตอบ)?:(.*?)(?=จุดที่ขาด|จุดอ่อน|จุดที่ต้องปรับปรุง|ข้อเสนอแนะ|$)',
            r'ข้อดี(?:ของคำตอบ)?:(.*?)(?=จุดที่ขาด|จุดอ่อน|จุดที่ต้องปรับปรุง|ข้อเสนอแนะ|$)',
            r'1\.\s*จุดเด่น(?:.*?):(.*?)(?=2\.|$)'
        ]
        
        for pattern in strengths_patterns:
            matches = re.search(pattern, evaluation_text, re.DOTALL)
            if matches:
                strengths_text = matches.group(1).strip()
                # แยกออกเป็นข้อๆ
                strengths_items = re.findall(r'[-•*]\s*(.*?)(?=[-•*]|$)', strengths_text)
                if strengths_items:
                    result["strengths"] = [item.strip() for item in strengths_items if item.strip()]
                elif strengths_text:
                    # ถ้าไม่พบ bullet points ให้ใช้ข้อความทั้งหมด
                    result["strengths"] = [strengths_text]
                break
        
        # วิธีที่ 2: หาหัวข้อที่เกี่ยวกับจุดที่ขาดหรือจุดอ่อน
        weaknesses_patterns = [
            r'จุดที่ขาด(?:หรือไม่ถูกต้อง)?:(.*?)(?=ข้อเสนอแนะ|จุดเด่น|$)',
            r'จุดอ่อน(?:ของคำตอบ)?:(.*?)(?=ข้อเสนอแนะ|จุดเด่น|$)',
            r'จุดที่ต้องปรับปรุง:(.*?)(?=ข้อเสนอแนะ|จุดเด่น|$)',
            r'2\.\s*จุดที่ขาด(?:.*?):(.*?)(?=3\.|$)'
        ]
        
        for pattern in weaknesses_patterns:
            matches = re.search(pattern, evaluation_text, re.DOTALL)
            if matches:
                weaknesses_text = matches.group(1).strip()
                # แยกออกเป็นข้อๆ
                weaknesses_items = re.findall(r'[-•*]\s*(.*?)(?=[-•*]|$)', weaknesses_text)
                if weaknesses_items:
                    result["weaknesses"] = [item.strip() for item in weaknesses_items if item.strip()]
                elif weaknesses_text:
                    # ถ้าไม่พบ bullet points ให้ใช้ข้อความทั้งหมด
                    result["weaknesses"] = [weaknesses_text]
                break
        
        # วิธีที่ 3: หาหัวข้อที่เกี่ยวกับข้อเสนอแนะ
        suggestions_patterns = [
            r'ข้อเสนอแนะ(?:ในการปรับปรุง)?:(.*?)(?=$)',
            r'3\.\s*ข้อเสนอแนะ(?:.*?):(.*?)(?=$)'
        ]
        
        for pattern in suggestions_patterns:
            matches = re.search(pattern, evaluation_text, re.DOTALL)
            if matches:
                suggestions_text = matches.group(1).strip()
                # แยกออกเป็นข้อๆ
                suggestions_items = re.findall(r'[-•*]\s*(.*?)(?=[-•*]|$)', suggestions_text)
                if suggestions_items:
                    result["suggestions"] = [item.strip() for item in suggestions_items if item.strip()]
                elif suggestions_text:
                    # ถ้าไม่พบ bullet points ให้ใช้ข้อความทั้งหมด
                    result["suggestions"] = [suggestions_text]
                break
        
        return result
    
    @staticmethod
    def display_evaluation_details(evaluation_result: Dict[str, Any], student_answer: str = "", show_raw=False):
        """
        แสดงผลการประเมินอย่างละเอียด
        
        Args:
            evaluation_result: ผลการประเมินที่มาจาก API
            student_answer: คำตอบของนักเรียน (ถ้ามี)
            show_raw: แสดงข้อความประเมินเต็มหรือไม่
        """
        print("\n" + "="*80)
        print(" "*30 + "รายละเอียดการประเมิน")
        print("="*80 + "\n")
        
        # แสดงคะแนน
        score = evaluation_result.get("score", 0)
        print(f"📊 คะแนน: {score}/10 ({score*10:.1f}%)")
        
        # แสดงคำตอบของนักเรียน (ถ้ามี)
        if student_answer:
            print("\n📝 คำตอบของนักเรียน:")
            print("-" * 40)
            # จัดรูปแบบคำตอบให้อ่านง่ายขึ้น
            wrapped_answer = "\n".join([
                textwrap.fill(line, width=70) for line in student_answer.strip().split("\n")
            ])
            print(wrapped_answer)
            print("-" * 40)
        
        # วิเคราะห์ผลการประเมิน
        evaluation_text = evaluation_result.get("evaluation", "")
        analysis = EvaluationAnalyzer.parse_evaluation(evaluation_text)
        
        # แสดงจุดเด่น
        if analysis["strengths"]:
            print("\n✅ จุดเด่นของคำตอบ:")
            for i, strength in enumerate(analysis["strengths"], 1):
                print(f"   {i}. {strength}")
        
        # แสดงจุดที่ขาดหรือไม่ถูกต้อง
        if analysis["weaknesses"]:
            print("\n❌ จุดที่ขาดหรือไม่ถูกต้อง:")
            for i, weakness in enumerate(analysis["weaknesses"], 1):
                print(f"   {i}. {weakness}")
        
        # แสดงข้อเสนอแนะ
        if analysis["suggestions"]:
            print("\n💡 ข้อเสนอแนะในการปรับปรุง:")
            for i, suggestion in enumerate(analysis["suggestions"], 1):
                print(f"   {i}. {suggestion}")
        
        # แสดงข้อความประเมินเต็ม (ถ้าต้องการ)
        if show_raw:
            print("\n📋 ข้อความประเมินเต็ม:")
            print("-" * 40)
            print(evaluation_text)
            print("-" * 40)
        
        print("\n" + "="*80 + "\n")
    
    @staticmethod
    def compare_evaluations(eval1: Dict[str, Any], eval2: Dict[str, Any], 
                            name1="ประเมินที่ 1", name2="ประเมินที่ 2"):
        """
        เปรียบเทียบผลการประเมิน 2 ชุด
        
        Args:
            eval1: ผลการประเมินชุดที่ 1
            eval2: ผลการประเมินชุดที่ 2
            name1: ชื่อของการประเมินชุดที่ 1
            name2: ชื่อของการประเมินชุดที่ 2
        """
        # วิเคราะห์ผลการประเมินทั้งสองชุด
        analysis1 = EvaluationAnalyzer.parse_evaluation(eval1.get("evaluation", ""))
        analysis2 = EvaluationAnalyzer.parse_evaluation(eval2.get("evaluation", ""))
        
        print("\n" + "="*80)
        print(" "*25 + "เปรียบเทียบผลการประเมิน")
        print("="*80 + "\n")
        
        # เปรียบเทียบคะแนน
        score1 = eval1.get("score", 0)
        score2 = eval2.get("score", 0)
        print(f"📊 คะแนน:")
        print(f"   {name1}: {score1}/10 ({score1*10:.1f}%)")
        print(f"   {name2}: {score2}/10 ({score2*10:.1f}%)")
        print(f"   ความต่าง: {abs(score1 - score2):.1f} คะแนน ({abs(score1 - score2)*10:.1f}%)")
        
        # เปรียบเทียบจุดเด่น
        print("\n✅ จุดเด่นของคำตอบ:")
        print(f"   {name1}:")
        for i, strength in enumerate(analysis1["strengths"], 1):
            print(f"     {i}. {strength}")
        print(f"   {name2}:")
        for i, strength in enumerate(analysis2["strengths"], 1):
            print(f"     {i}. {strength}")
        
        # เปรียบเทียบจุดที่ขาดหรือไม่ถูกต้อง
        print("\n❌ จุดที่ขาดหรือไม่ถูกต้อง:")
        print(f"   {name1}:")
        for i, weakness in enumerate(analysis1["weaknesses"], 1):
            print(f"     {i}. {weakness}")
        print(f"   {name2}:")
        for i, weakness in enumerate(analysis2["weaknesses"], 1):
            print(f"     {i}. {weakness}")
        
        # เปรียบเทียบข้อเสนอแนะ
        print("\n💡 ข้อเสนอแนะในการปรับปรุง:")
        print(f"   {name1}:")
        for i, suggestion in enumerate(analysis1["suggestions"], 1):
            print(f"     {i}. {suggestion}")
        print(f"   {name2}:")
        for i, suggestion in enumerate(analysis2["suggestions"], 1):
            print(f"     {i}. {suggestion}")
        
        print("\n" + "="*80 + "\n")

class PDFIntegrationTest(unittest.TestCase):
    """การทดสอบการอัปโหลดและประมวลผลไฟล์ PDF"""
    
    @classmethod
    def setUpClass(cls):
        """เตรียมสภาพแวดล้อมก่อนทำการทดสอบทั้งหมด"""
        print("\n" + "="*80)
        print(" "*20 + "เริ่มการทดสอบการทำงานกับไฟล์ PDF")
        print("="*80 + "\n")
        
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
        
        print("\n" + "="*80)
        print(" "*20 + "การทดสอบการทำงานกับไฟล์ PDF เสร็จสิ้น")
        print("="*80 + "\n")
    
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
            print(f"ตัวอย่างเนื้อหาที่สกัดได้ (100 ตัวอักษรแรก): {extracted_text[:100]}...")
            
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
            print(f"รหัสวิชา: {result['subject_id']}")
            print(f"รหัสคำถาม: {result['question_id']}")
            
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
        
        # แสดงรายละเอียดการประเมิน
        EvaluationAnalyzer.display_evaluation_details(result, TEST_STUDENT_ANSWER)
    
    def test_04_evaluate_incomplete_answer(self):
        """ทดสอบการประเมินคำตอบที่ไม่สมบูรณ์"""
        print("\n=== ทดสอบการประเมินคำตอบที่ไม่สมบูรณ์ ===")
        
        # ข้อมูลสำหรับการประเมินคำตอบที่ไม่สมบูรณ์
        eval_data = {
            "question": TEST_QUESTION,
            "student_answer": TEST_STUDENT_ANSWER_INCOMPLETE,
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
        
        # แสดงรายละเอียดการประเมิน
        EvaluationAnalyzer.display_evaluation_details(result, TEST_STUDENT_ANSWER_INCOMPLETE)
    
    def test_05_compare_evaluations(self):
        """ทดสอบการเปรียบเทียบผลการประเมินคำตอบที่แตกต่างกัน"""
        print("\n=== ทดสอบการเปรียบเทียบผลการประเมินคำตอบที่แตกต่างกัน ===")
        
        # ข้อมูลสำหรับการประเมินคำตอบที่สมบูรณ์
        eval_data_complete = {
            "question": TEST_QUESTION,
            "student_answer": TEST_STUDENT_ANSWER,
            "subject_id": TEST_SUBJECT_ID,
            "question_id": TEST_QUESTION_ID
        }
        
        # ข้อมูลสำหรับการประเมินคำตอบที่ไม่สมบูรณ์
        eval_data_incomplete = {
            "question": TEST_QUESTION,
            "student_answer": TEST_STUDENT_ANSWER_INCOMPLETE,
            "subject_id": TEST_SUBJECT_ID,
            "question_id": TEST_QUESTION_ID
        }
        
        # ส่งคำขอประเมินคำตอบทั้งสองแบบ
        response_complete = requests.post(f"{API_URL}/api/evaluation/evaluate", json=eval_data_complete)
        response_incomplete = requests.post(f"{API_URL}/api/evaluation/evaluate", json=eval_data_incomplete)
        
        self.assertEqual(response_complete.status_code, 200, "ประเมินคำตอบสมบูรณ์ไม่สำเร็จ")
        self.assertEqual(response_incomplete.status_code, 200, "ประเมินคำตอบไม่สมบูรณ์ไม่สำเร็จ")
        
        result_complete = response_complete.json()
        result_incomplete = response_incomplete.json()
        
        # เปรียบเทียบผลการประเมิน
        EvaluationAnalyzer.compare_evaluations(
            result_complete,
            result_incomplete,
            name1="คำตอบสมบูรณ์",
            name2="คำตอบไม่สมบูรณ์"
        )
    
    def test_06_complex_pdf_with_formatting(self):
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
            
            # แสดงรายละเอียดการประเมิน
            EvaluationAnalyzer.display_evaluation_details(eval_result, eval_data["student_answer"])
            
        finally:
            # ลบไฟล์ PDF
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)

if __name__ == "__main__":
    unittest.main()