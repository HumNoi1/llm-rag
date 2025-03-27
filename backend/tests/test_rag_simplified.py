# backend/tests/test_rag_simplified.py
import os
import sys
import unittest
import uuid
import tempfile
import time
import fitz  # PyMuPDF
from pathlib import Path
from dotenv import load_dotenv
import requests
import json

# เพิ่มพาธของโปรเจกต์เพื่อให้ import โมดูลได้
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_service import AnswerEvaluationService

class RagTester:
    """คลาสสำหรับทดสอบระบบ RAG แบบง่าย"""
    
    def __init__(self, api_base_url="http://localhost:8000"):
        """
        เริ่มต้นตัวทดสอบ RAG
        
        Args:
            api_base_url: URL ของ API ที่ต้องการทดสอบ
        """
        self.api_base_url = api_base_url
        self.subject_id = f"TEST_{uuid.uuid4().hex[:8]}"  # สร้าง ID ไม่ซ้ำกัน
        self.question_id = "Q1"
        
        # ข้อมูลตัวอย่างสำหรับทดสอบ
        self.test_content = """
        หลักการ SOLID ในการออกแบบซอฟต์แวร์
        ====================================
        
        SOLID เป็นแนวคิดในการออกแบบซอฟต์แวร์เชิงวัตถุ (Object-Oriented Design) ที่พัฒนาโดย Robert C. Martin 
        ประกอบด้วยหลักการ 5 ข้อ ดังนี้
        
        1. Single Responsibility Principle (SRP)
           - คลาสควรมีเหตุผลเพียงประการเดียวในการเปลี่ยนแปลง
           - แต่ละคลาสควรมีความรับผิดชอบต่อส่วนเดียวของฟังก์ชันงานเท่านั้น
           - ตัวอย่าง: แยกคลาส UserManager จากคลาส FileManager
        
        2. Open/Closed Principle (OCP)
           - คลาสควรเปิดให้ขยาย แต่ปิดสำหรับการแก้ไข
           - เราควรสามารถเพิ่มพฤติกรรมใหม่โดยไม่ต้องแก้ไขโค้ดเดิม
           - ตัวอย่าง: ใช้ Interface และ Inheritance แทนการแก้ไขคลาสเดิม
        
        3. Liskov Substitution Principle (LSP)
           - คลาสลูกควรสามารถแทนที่คลาสแม่ได้
           - คลาสลูกต้องไม่ละเมิดข้อตกลงของคลาสแม่
           - ตัวอย่าง: คลาส Square ต้องสามารถแทนที่คลาส Rectangle ได้อย่างถูกต้อง
        
        4. Interface Segregation Principle (ISP)
           - คลาสไม่ควรถูกบังคับให้พึ่งพาอินเทอร์เฟสที่พวกเขาไม่ได้ใช้
           - แยกอินเทอร์เฟสที่ใหญ่ให้เป็นอินเทอร์เฟสเล็กๆ ที่เฉพาะเจาะจง
           - ตัวอย่าง: แยก Printable, Scannable แทนการใช้ MFP ที่รวมความสามารถทั้งหมด
        
        5. Dependency Inversion Principle (DIP)
           - โมดูลระดับสูงไม่ควรขึ้นอยู่กับโมดูลระดับต่ำ ทั้งคู่ควรขึ้นอยู่กับนามธรรม
           - พึ่งพาการนามธรรมไม่ใช่คลาสที่เป็นรูปธรรม
           - ตัวอย่าง: ใช้ DbInterface แทนการขึ้นตรงกับ MySQLDatabase
        """
        
        self.test_question = "อธิบายหลักการ SOLID ในการออกแบบซอฟต์แวร์พร้อมยกตัวอย่าง"
        
        self.test_student_answers = [
            # คำตอบที่ดี
            """
            SOLID คือหลักการออกแบบซอฟต์แวร์ 5 ข้อดังนี้:
            1. Single Responsibility - คลาสควรมีหน้าที่เดียว เช่น แยก UserManager จาก FileManager
            2. Open/Closed - เปิดให้ขยาย ปิดการแก้ไข เช่น ใช้ Interface แทนการแก้ไขคลาสเดิม
            3. Liskov Substitution - คลาสลูกควรแทนคลาสแม่ได้ เช่น Square แทน Rectangle ได้
            4. Interface Segregation - แยกอินเทอร์เฟสให้เล็กลง เช่น แยก Printable จาก Scannable
            5. Dependency Inversion - พึ่งพาการนามธรรม เช่น ใช้ DbInterface แทน MySQLDatabase
            """,
            
            # คำตอบที่ไม่สมบูรณ์
            """
            SOLID ประกอบด้วย:
            1. Single Responsibility คือคลาสควรมีหน้าที่เดียว
            2. Open/Closed คือเปิดให้ขยาย ปิดการแก้ไข
            3. Liskov Substitution คือคลาสลูกแทนคลาสแม่ได้
            """,
            
            # คำตอบที่ไม่เกี่ยวข้อง
            """
            การออกแบบซอฟต์แวร์มีหลายรูปแบบ ควรคำนึงถึงประสิทธิภาพและการใช้งานเป็นหลัก
            ควรมีการทดสอบซอฟต์แวร์อย่างครบถ้วนก่อนนำไปใช้งานจริง
            """
        ]
    
    def create_test_pdf(self, content, filename=None):
        """
        สร้างไฟล์ PDF สำหรับทดสอบ
        
        Args:
            content: เนื้อหาที่ต้องการใส่ในไฟล์ PDF
            filename: ชื่อไฟล์ (ถ้าไม่ระบุจะสร้างไฟล์ชั่วคราว)
            
        Returns:
            path: พาธของไฟล์ PDF ที่สร้าง
        """
        # สร้างไฟล์ PDF ชั่วคราวหรือตามชื่อที่ระบุ
        if filename:
            pdf_path = filename
        else:
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                pdf_path = tmp.name
        
        # สร้างเอกสาร PDF
        doc = fitz.open()
        page = doc.new_page()
        
        # เพิ่มเนื้อหา
        page.insert_text((50, 50), "เอกสารทดสอบ", fontsize=14)
        
        # เพิ่มเนื้อหาหลักทีละบรรทัด
        y_pos = 80
        for line in content.split('\n'):
            page.insert_text((50, y_pos), line, fontsize=11)
            y_pos += 12
        
        # บันทึกไฟล์
        doc.save(pdf_path)
        doc.close()
        
        print(f"สร้างไฟล์ PDF สำเร็จ: {pdf_path}")
        return pdf_path
    
    def run_upload_test(self):
        """
        ทดสอบการอัปโหลดไฟล์ PDF
        
        Returns:
            bool: ผลการทดสอบ (True = สำเร็จ, False = ล้มเหลว)
        """
        print("\n=== ทดสอบการอัปโหลดไฟล์ PDF ===")
        
        # สร้างไฟล์ PDF ทดสอบ
        pdf_path = self.create_test_pdf(self.test_content)
        
        try:
            # ปรับ URL ตามที่ใช้งานจริง
            url = f"{self.api_base_url}/api/evaluation/upload-answer-key"
            
            # เตรียมข้อมูลสำหรับอัปโหลด
            with open(pdf_path, 'rb') as f:
                files = {'file': (os.path.basename(pdf_path), f, 'application/pdf')}
                data = {
                    'subject_id': self.subject_id,
                    'question_id': self.question_id
                }
                
                # เริ่มจับเวลา
                start_time = time.time()
                
                # ส่งคำขออัปโหลด
                response = requests.post(url, files=files, data=data)
                
                # คำนวณเวลาที่ใช้
                elapsed_time = time.time() - start_time
                
            # แสดงผลลัพธ์
            if response.status_code == 200:
                print(f"✅ อัปโหลดไฟล์สำเร็จ (ใช้เวลา {elapsed_time:.2f} วินาที)")
                print(f"ผลลัพธ์: {response.json()}")
                return True
            else:
                print(f"❌ อัปโหลดไฟล์ล้มเหลว: {response.status_code}")
                print(f"รายละเอียด: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาด: {str(e)}")
            return False
        finally:
            # ลบไฟล์ทดสอบ
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
    
    def run_retrieval_test(self, query):
        """
        ทดสอบการค้นหาข้อมูลที่เกี่ยวข้อง (ใช้โดยตรงกับ AnswerEvaluationService)
        
        Args:
            query: คำค้นหา
            
        Returns:
            documents: เอกสารที่เกี่ยวข้อง
        """
        print(f"\n=== ทดสอบการค้นหาข้อมูลที่เกี่ยวข้อง ===")
        print(f"คำค้นหา: {query}")
        
        try:
            # สร้าง RAG service
            rag_service = AnswerEvaluationService()
            
            # เริ่มจับเวลา
            start_time = time.time()
            
            # ทำการค้นหา
            documents = rag_service.retrieve_relevant_context(
                query, 
                self.subject_id, 
                self.question_id
            )
            
            # คำนวณเวลาที่ใช้
            elapsed_time = time.time() - start_time
            
            # แสดงผลลัพธ์
            print(f"พบ {len(documents)} เอกสารที่เกี่ยวข้อง (ใช้เวลา {elapsed_time:.2f} วินาที)")
            for i, doc in enumerate(documents, 1):
                print(f"\nเอกสารที่ {i}:")
                # แสดงแค่ 150 ตัวอักษรแรกของเอกสาร
                print(f"{doc.page_content[:150]}...")
            
            return documents
            
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาด: {str(e)}")
            return []
    
    def run_evaluation_test(self, answer_index=0):
        """
        ทดสอบการประเมินคำตอบ
        
        Args:
            answer_index: ดัชนีของคำตอบทดสอบที่ต้องการใช้
            
        Returns:
            dict: ผลการประเมิน
        """
        print(f"\n=== ทดสอบการประเมินคำตอบ ===")
        
        # เลือกคำตอบทดสอบ
        student_answer = self.test_student_answers[answer_index]
        
        try:
            # ปรับ URL ตามที่ใช้งานจริง
            url = f"{self.api_base_url}/api/evaluation/evaluate"
            
            # เตรียมข้อมูลสำหรับประเมิน
            data = {
                'question': self.test_question,
                'student_answer': student_answer,
                'subject_id': self.subject_id,
                'question_id': self.question_id
            }
            
            # เริ่มจับเวลา
            start_time = time.time()
            
            # ส่งคำขอประเมิน
            response = requests.post(url, json=data)
            
            # คำนวณเวลาที่ใช้
            elapsed_time = time.time() - start_time
            
            # แสดงผลลัพธ์
            if response.status_code == 200:
                result = response.json()
                print(f"✅ ประเมินคำตอบสำเร็จ (ใช้เวลา {elapsed_time:.2f} วินาที)")
                print(f"คะแนน: {result['score']}/10")
                print(f"\nการประเมิน:")
                print(f"{result['evaluation']}")
                return result
            else:
                print(f"❌ ประเมินคำตอบล้มเหลว: {response.status_code}")
                print(f"รายละเอียด: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาด: {str(e)}")
            return None
    
    def run_comparative_test(self):
        """
        ทดสอบเปรียบเทียบการประเมินคำตอบแบบต่างๆ
        
        Returns:
            list: ผลการประเมินทั้งหมด
        """
        print("\n=== ทดสอบเปรียบเทียบการประเมินคำตอบต่างๆ ===")
        
        results = []
        descriptions = [
            "คำตอบที่ดี",
            "คำตอบที่ไม่สมบูรณ์",
            "คำตอบที่ไม่เกี่ยวข้อง"
        ]
        
        for i, desc in enumerate(descriptions):
            print(f"\n--- ทดสอบกับ{desc} ---")
            result = self.run_evaluation_test(i)
            if result:
                results.append({
                    "description": desc,
                    "score": result["score"],
                    "evaluation": result["evaluation"]
                })
        
        # แสดงผลสรุปการเปรียบเทียบ
        print("\n=== สรุปผลการทดสอบ ===")
        print("| ประเภทคำตอบ | คะแนน |")
        print("|------------|--------|")
        for result in results:
            print(f"| {result['description']} | {result['score']}/10 |")
        
        return results

def main():
    """ฟังก์ชันหลักสำหรับทดสอบ"""
    load_dotenv()  # โหลดตัวแปรจาก .env
    
    print("=" * 60)
    print(" " * 15 + "ทดสอบระบบ RAG สำหรับการประเมินคำตอบ")
    print("=" * 60)
    
    # สร้างตัวทดสอบ
    tester = RagTester()
    
    # ทดสอบการอัปโหลด
    upload_success = tester.run_upload_test()
    
    if upload_success:
        # ทดสอบการค้นหา
        tester.run_retrieval_test("อธิบายหลักการ Single Responsibility และ Open/Closed")
        
        # ทดสอบการประเมินแบบเปรียบเทียบ
        tester.run_comparative_test()
    
    print("\n" + "=" * 60)
    print(" " * 20 + "การทดสอบเสร็จสิ้น")
    print("=" * 60)

if __name__ == "__main__":
    main()