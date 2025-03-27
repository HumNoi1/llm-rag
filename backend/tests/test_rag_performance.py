# backend/tests/test_rag_performance.py
import os
import sys
import time
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import tempfile
import fitz  # PyMuPDF
import uuid
from dotenv import load_dotenv
import requests
from sklearn.metrics import precision_recall_fscore_support
from datetime import datetime

# เพิ่มพาธของโปรเจกต์เพื่อให้ import โมดูลได้
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_service import AnswerEvaluationService
from app.services.llm_service import LLMEvaluationService
from app.services.model_service import ModelService

class RAGTester:
    """คลาสสำหรับทดสอบประสิทธิภาพของระบบ RAG สำหรับตรวจข้อสอบอัตนัย"""
    
    def __init__(self, api_base_url="http://localhost:8000", use_api=True):
        """
        เริ่มต้นตัวทดสอบ RAG Performance
        
        Args:
            api_base_url: URL ของ API (กรณีทดสอบผ่าน API)
            use_api: ใช้ API หรือเรียกใช้ service โดยตรง
        """
        self.api_base_url = api_base_url
        self.use_api = use_api
        self.test_date = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        self.results_dir = Path(f"./test_results/{self.test_date}")
        self.results_dir.mkdir(parents=True, exist_ok=True)
        
        # สร้าง ID ที่ไม่ซ้ำกันสำหรับการทดสอบ
        self.subject_id = f"TEST_{uuid.uuid4().hex[:8]}"
        
        # ถ้าไม่ใช้ API ให้เตรียม service
        if not self.use_api:
            self.rag_service = AnswerEvaluationService()
            model_service = ModelService()
            self.llm_service = LLMEvaluationService(self.rag_service)
        
        # ตั้งค่าเริ่มต้นสำหรับผลการทดสอบ
        self.test_results = {
            "retrieval_accuracy": {},
            "contextual_understanding": {},
            "thai_language": {},
            "answer_variability": {},
            "performance": {}
        }
    
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
        y_pos = 50
        for line in content.split('\n'):
            page.insert_text((50, y_pos), line, fontsize=11)
            y_pos += 15  # เพิ่ม y position สำหรับบรรทัดถัดไป
        
        # บันทึกไฟล์
        doc.save(pdf_path)
        doc.close()
        
        print(f"สร้างไฟล์ PDF สำเร็จ: {pdf_path}")
        return pdf_path
    
    def upload_answer_key(self, content, question_id):
        """
        อัปโหลดเฉลยสำหรับทดสอบ
        
        Args:
            content: เนื้อหาเฉลย
            question_id: รหัสคำถาม
            
        Returns:
            bool: ผลการอัปโหลด (True = สำเร็จ, False = ล้มเหลว)
        """
        print(f"\n--- อัปโหลดเฉลยสำหรับคำถาม {question_id} ---")
        
        # สร้างไฟล์ PDF
        pdf_path = self.create_test_pdf(content)
        
        try:
            if self.use_api:
                # ใช้ API
                url = f"{self.api_base_url}/api/evaluation/upload-answer-key"
                
                with open(pdf_path, 'rb') as f:
                    files = {'file': (os.path.basename(pdf_path), f, 'application/pdf')}
                    data = {
                        'subject_id': self.subject_id,
                        'question_id': question_id
                    }
                    
                    start_time = time.time()
                    response = requests.post(url, files=files, data=data)
                    elapsed_time = time.time() - start_time
                    
                if response.status_code == 200:
                    print(f"✅ อัปโหลดเฉลยสำเร็จ (ใช้เวลา {elapsed_time:.2f} วินาที)")
                    return True
                else:
                    print(f"❌ อัปโหลดเฉลยล้มเหลว: {response.status_code}")
                    print(f"รายละเอียด: {response.text}")
                    return False
            else:
                # ใช้ service โดยตรง
                with open(pdf_path, 'rb') as f:
                    file_content = f.read()
                
                start_time = time.time()
                chunk_count = self.rag_service.index_answer_key(
                    file_content,
                    self.subject_id,
                    question_id,
                    os.path.basename(pdf_path)
                )
                elapsed_time = time.time() - start_time
                
                print(f"✅ เพิ่มเฉลยสำเร็จ: {chunk_count} ชิ้นส่วน (ใช้เวลา {elapsed_time:.2f} วินาที)")
                return True
                
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาด: {str(e)}")
            return False
        finally:
            # ลบไฟล์ทดสอบ
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
    
    def evaluate_answer(self, question, student_answer, question_id):
        """
        ประเมินคำตอบของนักเรียน
        
        Args:
            question: คำถาม
            student_answer: คำตอบของนักเรียน
            question_id: รหัสคำถาม
            
        Returns:
            dict: ผลการประเมิน หรือ None ถ้าล้มเหลว
        """
        try:
            start_time = time.time()
            
            if self.use_api:
                # ใช้ API
                url = f"{self.api_base_url}/api/evaluation/evaluate"
                
                data = {
                    'question': question,
                    'student_answer': student_answer,
                    'subject_id': self.subject_id,
                    'question_id': question_id
                }
                
                response = requests.post(url, json=data)
                
                if response.status_code == 200:
                    result = response.json()
                else:
                    print(f"❌ ประเมินคำตอบล้มเหลว: {response.status_code}")
                    print(f"รายละเอียด: {response.text}")
                    return None
            else:
                # ใช้ service โดยตรง
                result = self.llm_service.evaluate_answer(
                    question=question,
                    student_answer=student_answer,
                    subject_id=self.subject_id,
                    question_id=question_id
                )
            
            elapsed_time = time.time() - start_time
            result['processing_time'] = elapsed_time
            
            return result
                
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาด: {str(e)}")
            return None
    
    def test_retrieval_accuracy(self):
        """
        ทดสอบความแม่นยำในการค้นคืนเนื้อหา
        
        Returns:
            dict: ผลการทดสอบ
        """
        print("\n=== ทดสอบความแม่นยำในการค้นคืนเนื้อหา ===")
        question_id = "RETRIEVAL_TEST"
        
        # เนื้อหาเฉลยที่มีข้อมูลหลากหลาย
        answer_key_content = """
        วงจรชีวิตการพัฒนาซอฟต์แวร์ (Software Development Life Cycle - SDLC)
        
        SDLC คือกระบวนการที่ใช้ในการพัฒนาซอฟต์แวร์ให้มีคุณภาพ ซึ่งประกอบไปด้วยขั้นตอนดังนี้:
        
        1. การวางแผนโครงการ (Project Planning)
           - กำหนดขอบเขตของโครงการ
           - วางแผนทรัพยากรและระยะเวลา
           - ประเมินความเสี่ยงเบื้องต้น
        
        2. การวิเคราะห์ความต้องการ (Requirements Analysis)
           - รวบรวมความต้องการจากผู้ใช้
           - วิเคราะห์ความเป็นไปได้
           - จัดทำเอกสารข้อกำหนดความต้องการ
        
        3. การออกแบบ (Design)
           - ออกแบบสถาปัตยกรรมซอฟต์แวร์
           - ออกแบบฐานข้อมูล
           - ออกแบบส่วนติดต่อผู้ใช้ (UI/UX)
           - ออกแบบองค์ประกอบย่อยและโมดูล
        
        4. การพัฒนา (Implementation/Coding)
           - เขียนโค้ดตามที่ได้ออกแบบไว้
           - ใช้แนวปฏิบัติในการเขียนโค้ดที่ดี
           - ทำการทดสอบเบื้องต้น (Unit Testing)
        
        5. การทดสอบ (Testing)
           - ทดสอบระดับหน่วย (Unit Testing)
           - ทดสอบการบูรณาการ (Integration Testing)
           - ทดสอบระบบ (System Testing)
           - ทดสอบการยอมรับ (Acceptance Testing)
        
        6. การติดตั้งและนำไปใช้ (Deployment)
           - ติดตั้งซอฟต์แวร์ในสภาพแวดล้อมจริง
           - ฝึกอบรมผู้ใช้งาน
           - ทำการย้ายข้อมูลถ้าจำเป็น
        
        7. การบำรุงรักษา (Maintenance)
           - แก้ไขข้อผิดพลาดที่พบหลังการใช้งาน
           - ปรับปรุงประสิทธิภาพ
           - เพิ่มฟีเจอร์ใหม่ตามความต้องการ
        
        รูปแบบของ SDLC มีหลายแบบ ได้แก่:
        
        - แบบน้ำตก (Waterfall Model): ทำตามขั้นตอนเรียงลำดับ ไม่ย้อนกลับ
        - แบบเกลียว (Spiral Model): เน้นการประเมินความเสี่ยงในแต่ละรอบ
        - แบบวนซ้ำ (Iterative Model): พัฒนาเป็นรอบๆ โดยแต่ละรอบมีการเพิ่มฟีเจอร์
        - แบบอไจล์ (Agile Model): เน้นความยืดหยุ่น การปรับตัว และการพัฒนาแบบรวดเร็ว
        """
        
        # อัปโหลดเฉลย
        if not self.upload_answer_key(answer_key_content, question_id):
            return {"status": "failed", "reason": "upload_failed"}
        
        # คำถามสำหรับทดสอบความแม่นยำ
        test_queries = [
            {
                "query": "อธิบายขั้นตอนการทดสอบใน SDLC",
                "expected_keywords": ["Unit Testing", "Integration Testing", "System Testing", "Acceptance Testing"]
            },
            {
                "query": "มีรูปแบบของ SDLC กี่แบบ และมีอะไรบ้าง",
                "expected_keywords": ["น้ำตก", "Waterfall", "เกลียว", "Spiral", "วนซ้ำ", "Iterative", "อไจล์", "Agile"]
            },
            {
                "query": "ขั้นตอน Deployment ประกอบด้วยอะไรบ้าง",
                "expected_keywords": ["ติดตั้ง", "สภาพแวดล้อมจริง", "ฝึกอบรม", "ย้ายข้อมูล"]
            }
        ]
        
        results = []
        
        for test_case in test_queries:
            print(f"\nทดสอบค้นหา: {test_case['query']}")
            
            # ดึงข้อมูลที่เกี่ยวข้องโดยตรงจาก RAG service
            if not self.use_api:
                docs = self.rag_service.retrieve_relevant_context(
                    test_case['query'],
                    self.subject_id,
                    question_id
                )
                
                # คำนวณความแม่นยำ
                found_keywords = 0
                retrieved_text = " ".join([doc.page_content for doc in docs])
                
                for keyword in test_case['expected_keywords']:
                    if keyword in retrieved_text:
                        found_keywords += 1
                        print(f"  ✅ พบคำสำคัญ: {keyword}")
                    else:
                        print(f"  ❌ ไม่พบคำสำคัญ: {keyword}")
                
                precision = found_keywords / len(test_case['expected_keywords'])
                
                # บันทึกผลลัพธ์
                case_result = {
                    "query": test_case['query'],
                    "precision": precision,
                    "found_keywords": found_keywords,
                    "total_keywords": len(test_case['expected_keywords']),
                    "retrieved_text": retrieved_text
                }
                
                results.append(case_result)
                print(f"  ความแม่นยำ: {precision * 100:.2f}%")
            else:
                # ใช้การประเมินคำตอบแทนเมื่อไม่สามารถเข้าถึง RAG service โดยตรง
                sample_answer = "ไม่ทราบคำตอบ"
                result = self.evaluate_answer(test_case['query'], sample_answer, question_id)
                
                if result:
                    found_keywords = 0
                    for keyword in test_case['expected_keywords']:
                        if keyword in result['evaluation']:
                            found_keywords += 1
                            print(f"  ✅ พบคำสำคัญ: {keyword}")
                        else:
                            print(f"  ❌ ไม่พบคำสำคัญ: {keyword}")
                    
                    precision = found_keywords / len(test_case['expected_keywords'])
                    
                    case_result = {
                        "query": test_case['query'],
                        "precision": precision,
                        "found_keywords": found_keywords,
                        "total_keywords": len(test_case['expected_keywords']),
                        "evaluation": result['evaluation']
                    }
                    
                    results.append(case_result)
                    print(f"  ความแม่นยำ: {precision * 100:.2f}%")
        
        # คำนวณความแม่นยำเฉลี่ย
        if results:
            avg_precision = sum(r['precision'] for r in results) / len(results)
            
            # สรุปผล
            summary = {
                "status": "success",
                "avg_precision": avg_precision,
                "details": results
            }
            
            print(f"\nความแม่นยำเฉลี่ยในการค้นคืน: {avg_precision * 100:.2f}%")
            
            # บันทึกผลการทดสอบ
            self.test_results["retrieval_accuracy"] = summary
            
            return summary
        else:
            return {"status": "failed", "reason": "no_results"}
    
    def test_contextual_understanding(self):
        """
        ทดสอบความสามารถในการเข้าใจบริบท
        
        Returns:
            dict: ผลการทดสอบ
        """
        print("\n=== ทดสอบความสามารถในการเข้าใจบริบท ===")
        question_id = "CONTEXT_TEST"
        
        # เนื้อหาเฉลยเกี่ยวกับการทดสอบซอฟต์แวร์
        answer_key_content = """
        การทดสอบซอฟต์แวร์ (Software Testing)
        
        การทดสอบซอฟต์แวร์เป็นกระบวนการตรวจสอบคุณภาพของซอฟต์แวร์ เพื่อค้นหาข้อผิดพลาดและตรวจสอบว่าซอฟต์แวร์ตรงตามความต้องการหรือไม่
        
        1. ประเภทของการทดสอบซอฟต์แวร์:
        
           1.1 การทดสอบแบบกล่องดำ (Black Box Testing)
               - เป็นการทดสอบโดยไม่สนใจโครงสร้างภายใน
               - มุ่งเน้นที่ input และ output
               - ตัวอย่างเทคนิค: Boundary Value Analysis, Equivalence Partitioning
               
           1.2 การทดสอบแบบกล่องขาว (White Box Testing)
               - เป็นการทดสอบโดยพิจารณาโครงสร้างภายใน
               - มุ่งเน้นที่โค้ดและกลไกภายใน
               - ตัวอย่างเทคนิค: Statement Coverage, Branch Coverage
               
           1.3 การทดสอบแบบกล่องเทา (Gray Box Testing)
               - ผสมผสานระหว่างกล่องดำและกล่องขาว
               - ทดสอบโดยมีความรู้บางส่วนเกี่ยวกับโครงสร้างภายใน
        
        2. ระดับของการทดสอบ:
        
           2.1 การทดสอบระดับหน่วย (Unit Testing)
               - ทดสอบส่วนย่อยที่สุดของโปรแกรม เช่น ฟังก์ชัน คลาส
               - มักเขียนโดยนักพัฒนา
               - เครื่องมือ: JUnit, NUnit, PyTest
               
           2.2 การทดสอบการบูรณาการ (Integration Testing)
               - ทดสอบการทำงานร่วมกันระหว่างโมดูล
               - ตรวจสอบการส่งข้อมูลและการเชื่อมต่อ
               - วิธีการ: Big Bang, Top-Down, Bottom-Up
               
           2.3 การทดสอบระบบ (System Testing)
               - ทดสอบระบบทั้งหมด
               - ตรวจสอบว่าตรงตามข้อกำหนดความต้องการ
               - รวมถึงการทดสอบด้านความปลอดภัย ประสิทธิภาพ
               
           2.4 การทดสอบการยอมรับ (Acceptance Testing)
               - ทดสอบโดยผู้ใช้งานจริง
               - ตรวจสอบว่าตรงตามความต้องการทางธุรกิจ
               - User Acceptance Testing (UAT)
        
        3. เทคนิคการทดสอบ:
        
           3.1 การทดสอบฟังก์ชัน (Functional Testing)
               - ทดสอบว่าระบบทำงานตามฟังก์ชันที่กำหนดหรือไม่
               
           3.2 การทดสอบไม่เป็นฟังก์ชัน (Non-functional Testing)
               - ทดสอบคุณลักษณะอื่นๆ เช่น ประสิทธิภาพ ความเสถียร
               - Performance Testing, Load Testing, Stress Testing
               
           3.3 การทดสอบการถดถอย (Regression Testing)
               - ทดสอบซ้ำหลังการเปลี่ยนแปลง
               - ตรวจสอบว่าการเปลี่ยนแปลงไม่กระทบการทำงานเดิม
        """
        
        # อัปโหลดเฉลย
        if not self.upload_answer_key(answer_key_content, question_id):
            return {"status": "failed", "reason": "upload_failed"}
        
        # คำถามสำหรับทดสอบความเข้าใจบริบท
        test_cases = [
            {
                "question": "อธิบายข้อแตกต่างระหว่างการทดสอบแบบกล่องดำและกล่องขาว",
                "student_answer": "ผมคิดว่าทั้งสองแบบเป็นการทดสอบเหมือนกัน ไม่มีความแตกต่างกัน",
                "expected_context": ["กล่องดำ", "Black Box", "กล่องขาว", "White Box", "โครงสร้างภายใน", "input", "output"]
            },
            {
                "question": "ถ้าคุณต้องการทดสอบฟังก์ชันย่อย ควรใช้การทดสอบระดับใด",
                "student_answer": "ควรใช้การทดสอบระบบ เพราะทำให้เห็นภาพรวมได้ดี",
                "expected_context": ["ทดสอบระดับหน่วย", "Unit Testing", "ฟังก์ชัน", "คลาส", "นักพัฒนา"]
            },
            {
                "question": "การทดสอบการถดถอยมีประโยชน์อย่างไร",
                "student_answer": "ไม่ทราบว่ามีประโยชน์อย่างไร",
                "expected_context": ["การถดถอย", "Regression Testing", "ทดสอบซ้ำ", "การเปลี่ยนแปลง", "กระทบการทำงานเดิม"]
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\nทดสอบกรณีที่ {i}:")
            print(f"คำถาม: {test_case['question']}")
            print(f"คำตอบนักเรียน: {test_case['student_answer']}")
            
            # ประเมินคำตอบ
            result = self.evaluate_answer(
                test_case['question'],
                test_case['student_answer'],
                question_id
            )
            
            if result:
                # ตรวจสอบว่ามีการดึงข้อมูลจากบริบทที่ถูกต้อง
                context_score = 0
                for keyword in test_case['expected_context']:
                    if keyword in result['evaluation']:
                        context_score += 1
                        print(f"  ✅ พบคำสำคัญในบริบท: {keyword}")
                    else:
                        print(f"  ❌ ไม่พบคำสำคัญในบริบท: {keyword}")
                
                context_accuracy = context_score / len(test_case['expected_context']) if test_case['expected_context'] else 0
                
                # บันทึกผลลัพธ์
                case_result = {
                    "question": test_case['question'],
                    "student_answer": test_case['student_answer'],
                    "evaluation": result['evaluation'],
                    "score": result['score'],
                    "context_accuracy": context_accuracy,
                    "processing_time": result.get('processing_time', 0)
                }
                
                results.append(case_result)
                print(f"  ความถูกต้องของบริบท: {context_accuracy * 100:.2f}%")
                print(f"  คะแนนที่ได้: {result['score']}/10")
        
        # คำนวณความแม่นยำเฉลี่ย
        if results:
            avg_context_accuracy = sum(r['context_accuracy'] for r in results) / len(results)
            avg_score = sum(r['score'] for r in results) / len(results)
            avg_time = sum(r.get('processing_time', 0) for r in results) / len(results)
            
            # สรุปผล
            summary = {
                "status": "success",
                "avg_context_accuracy": avg_context_accuracy,
                "avg_score": avg_score,
                "avg_processing_time": avg_time,
                "details": results
            }
            
            print(f"\nความถูกต้องของบริบทเฉลี่ย (Avg Context Accuracy): {avg_context_accuracy * 100:.2f}%")
            print(f"คะแนนเฉลี่ย (Avg Score): {avg_score:.2f}/10")
            print(f"เวลาประมวลผลเฉลี่ย (Avg Processing Time): {avg_time:.2f} วินาที")
            
            # บันทึกผลการทดสอบ
            self.test_results["contextual_understanding"] = summary
            
            return summary
        else:
            return {"status": "failed", "reason": "no_results"}
    
    def test_thai_language(self):
        """
        ทดสอบประสิทธิภาพกับภาษาไทย
        
        Returns:
            dict: ผลการทดสอบ
        """
        print("\n=== ทดสอบประสิทธิภาพกับภาษาไทย ===")
        question_id = "THAI_TEST"
        
        # เนื้อหาเฉลยภาษาไทย
        answer_key_content = """
        หลักการออกแบบส่วนติดต่อผู้ใช้ (User Interface Design Principles)
        
        การออกแบบส่วนติดต่อผู้ใช้ (UI) ที่ดีจะช่วยให้ผู้ใช้สามารถใช้งานซอฟต์แวร์ได้อย่างมีประสิทธิภาพและพึงพอใจ โดยมีหลักการสำคัญดังนี้:
        
        1. ความเรียบง่าย (Simplicity)
           - การออกแบบที่ไม่ซับซ้อน เข้าใจง่าย
           - ลดความยุ่งยากในการใช้งาน
           - ไม่มีองค์ประกอบที่ไม่จำเป็น
        
        2. ความสอดคล้อง (Consistency)
           - ใช้รูปแบบ สี ตำแหน่ง และองค์ประกอบต่างๆ อย่างสม่ำเสมอ
           - ทำให้ผู้ใช้สามารถคาดเดาการทำงานได้
           - สร้างความคุ้นเคยในการใช้งาน
        
        3. การมองเห็นได้ (Visibility)
           - องค์ประกอบสำคัญควรมองเห็นได้ชัดเจน
           - แสดงสถานะของระบบให้ผู้ใช้ทราบ
           - ใช้ตัวชี้แนะทางสายตาที่เหมาะสม
        
        4. การให้ข้อมูลย้อนกลับ (Feedback)
           - แจ้งผลการกระทำของผู้ใช้อย่างชัดเจน
           - ตอบสนองเมื่อผู้ใช้ดำเนินการเสร็จสิ้น
           - แสดงข้อผิดพลาดอย่างเป็นมิตรและมีประโยชน์
        
        5. ความยืดหยุ่น (Flexibility)
           - รองรับผู้ใช้ที่มีทักษะแตกต่างกัน
           - มีทางเลือกในการใช้งานหลายรูปแบบ
           - ปรับให้เข้ากับความต้องการที่หลากหลาย
        
        6. การควบคุมของผู้ใช้ (User Control)
           - ให้ผู้ใช้รู้สึกว่าควบคุมการทำงานได้
           - สามารถยกเลิกหรือทำซ้ำการกระทำได้
           - ไม่บังคับให้ผู้ใช้ทำตามขั้นตอนที่ตายตัวเกินไป
        
        7. การป้องกันข้อผิดพลาด (Error Prevention)
           - ออกแบบเพื่อป้องกันข้อผิดพลาดที่อาจเกิดขึ้น
           - ใช้การยืนยันก่อนดำเนินการที่สำคัญ
           - จำกัดตัวเลือกที่อาจนำไปสู่ข้อผิดพลาด
        
        8. ความเป็นธรรมชาติ (Naturalness)
           - ใช้ภาษาและสัญลักษณ์ที่ผู้ใช้คุ้นเคย
           - ลำดับขั้นตอนสอดคล้องกับการทำงานในโลกจริง
           - ใช้การเปรียบเทียบกับสิ่งที่มีอยู่ในชีวิตประจำวัน
        """
        
        # อัปโหลดเฉลย
        if not self.upload_answer_key(answer_key_content, question_id):
            return {"status": "failed", "reason": "upload_failed"}
        
        # คำถามสำหรับทดสอบภาษาไทย
        test_cases = [
            {
                "question": "อธิบายหลักการออกแบบ UI ที่เกี่ยวกับความเรียบง่ายและความสอดคล้อง",
                "student_answer": "ความเรียบง่ายคือการออกแบบที่ไม่ซับซ้อน ส่วนความสอดคล้องคือการใช้รูปแบบที่เหมือนกันตลอดทั้งระบบ",
                "expected_context": ["เรียบง่าย", "Simplicity", "ซับซ้อน", "สอดคล้อง", "Consistency", "รูปแบบ", "สี", "ตำแหน่ง"]
            },
            {
                "question": "การให้ข้อมูลย้อนกลับ (Feedback) มีความสำคัญต่อการออกแบบ UI อย่างไร",
                "student_answer": "การให้ข้อมูลย้อนกลับทำให้ผู้ใช้รู้ว่าระบบกำลังทำงานอยู่ เช่น แสดงข้อความเมื่อบันทึกข้อมูลสำเร็จ",
                "expected_context": ["ข้อมูลย้อนกลับ", "Feedback", "แจ้งผล", "ตอบสนอง", "ข้อผิดพลาด"]
            },
            {
                "question": "หลักการป้องกันข้อผิดพลาดในการออกแบบ UI ควรทำอย่างไร",
                "student_answer": "เราควรใส่ปุ่มยืนยันก่อนลบข้อมูลสำคัญ และแสดงข้อความแจ้งเตือนที่ชัดเจน",
                "expected_context": ["ป้องกันข้อผิดพลาด", "Error Prevention", "ยืนยัน", "ดำเนินการที่สำคัญ", "จำกัดตัวเลือก"]
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\nทดสอบกรณีที่ {i}:")
            print(f"คำถาม: {test_case['question']}")
            print(f"คำตอบนักเรียน: {test_case['student_answer']}")
            
            # ประเมินคำตอบ
            result = self.evaluate_answer(
                test_case['question'],
                test_case['student_answer'],
                question_id
            )
            
            if result:
                # ตรวจสอบการเข้าใจภาษาไทย
                context_score = 0
                for keyword in test_case['expected_context']:
                    if keyword in result['evaluation']:
                        context_score += 1
                        print(f"  ✅ พบคำสำคัญในภาษาไทย: {keyword}")
                    else:
                        print(f"  ❌ ไม่พบคำสำคัญในภาษาไทย: {keyword}")
                
                thai_accuracy = context_score / len(test_case['expected_context']) if test_case['expected_context'] else 0
                
                # ตรวจสอบการใช้ภาษาไทยในการประเมิน
                thai_chars = len([c for c in result['evaluation'] if ord(c) > 3584 and ord(c) < 3711])
                total_chars = len(result['evaluation'])
                thai_ratio = thai_chars / total_chars if total_chars > 0 else 0
                
                # บันทึกผลลัพธ์
                case_result = {
                    "question": test_case['question'],
                    "student_answer": test_case['student_answer'],
                    "evaluation": result['evaluation'],
                    "score": result['score'],
                    "thai_accuracy": thai_accuracy,
                    "thai_ratio": thai_ratio,
                    "processing_time": result.get('processing_time', 0)
                }
                
                results.append(case_result)
                print(f"  ความถูกต้องในการเข้าใจภาษาไทย: {thai_accuracy * 100:.2f}%")
                print(f"  สัดส่วนการใช้ภาษาไทยในการประเมิน: {thai_ratio * 100:.2f}%")
                print(f"  คะแนนที่ได้: {result['score']}/10")
        
        # คำนวณความแม่นยำเฉลี่ย
        if results:
            avg_thai_accuracy = sum(r['thai_accuracy'] for r in results) / len(results)
            avg_thai_ratio = sum(r['thai_ratio'] for r in results) / len(results)
            avg_score = sum(r['score'] for r in results) / len(results)
            avg_time = sum(r.get('processing_time', 0) for r in results) / len(results)
            
            # สรุปผล
            summary = {
                "status": "success",
                "avg_thai_accuracy": avg_thai_accuracy,
                "avg_thai_ratio": avg_thai_ratio,
                "avg_score": avg_score,
                "avg_processing_time": avg_time,
                "details": results
            }
            
            print(f"\nความถูกต้องในการเข้าใจภาษาไทยเฉลี่ย (Avg Thai Accuracy): {avg_thai_accuracy * 100:.2f}%")
            print(f"สัดส่วนการใช้ภาษาไทยในการประเมินเฉลี่ย (Avg Thai Ratio): {avg_thai_ratio * 100:.2f}%")
            print(f"คะแนนเฉลี่ย (Avg Score): {avg_score:.2f}/10")
            print(f"เวลาประมวลผลเฉลี่ย (Avg Processing Time): {avg_time:.2f} วินาที")
            
            # บันทึกผลการทดสอบ
            self.test_results["thai_language"] = summary
            
            return summary
        else:
            return {"status": "failed", "reason": "no_results"}
    
    def test_answer_variability(self):
        """
        ทดสอบการประเมินคำตอบที่มีความแตกต่าง
        
        Returns:
            dict: ผลการทดสอบ
        """
        print("\n=== ทดสอบการประเมินคำตอบที่มีความแตกต่าง ===")
        question_id = "VARIABILITY_TEST"
        
        # เนื้อหาเฉลยเกี่ยวกับ Design Patterns
        answer_key_content = """
        รูปแบบการออกแบบ (Design Patterns) ในวิศวกรรมซอฟต์แวร์
        
        รูปแบบการออกแบบ คือ วิธีการแก้ปัญหาทั่วไปที่เกิดขึ้นซ้ำๆ ในการออกแบบซอฟต์แวร์ โดยเป็นแนวทางหรือแม่แบบที่สามารถนำไปปรับใช้กับสถานการณ์ต่างๆ ได้
        
        1. รูปแบบการสร้างวัตถุ (Creational Patterns)
           - เกี่ยวข้องกับกระบวนการสร้างวัตถุ
           - ช่วยทำให้ระบบเป็นอิสระจากวิธีการสร้างวัตถุ
           
           1.1 Singleton Pattern
               - รับประกันว่าคลาสจะมีอินสแตนซ์เพียงตัวเดียว
               - ให้การเข้าถึงอินสแตนซ์นั้นจากทั่วทั้งระบบ
               - ใช้กับ logging, driver objects, caching
           
           1.2 Factory Method Pattern
               - กำหนดอินเทอร์เฟซสำหรับสร้างวัตถุ
               - ให้คลาสย่อยตัดสินใจว่าจะสร้างอินสแตนซ์ของคลาสใด
               - ใช้เมื่อคลาสไม่สามารถคาดเดาล่วงหน้าได้ว่าจะต้องสร้างอินสแตนซ์ของคลาสใด
           
           1.3 Abstract Factory Pattern
               - สร้างกลุ่มของวัตถุที่เกี่ยวข้องกันโดยไม่ระบุคลาสที่เฉพาะเจาะจง
               - ใช้เมื่อระบบต้องเป็นอิสระจากวิธีการสร้างวัตถุ
        
        2. รูปแบบโครงสร้าง (Structural Patterns)
           - เกี่ยวข้องกับองค์ประกอบของคลาสและวัตถุ
           - รวมคลาสและวัตถุเข้าด้วยกันเป็นโครงสร้างที่ใหญ่ขึ้น
           
           2.1 Adapter Pattern
               - แปลงอินเทอร์เฟซของคลาสให้ตรงกับอีกอินเทอร์เฟซที่ไคลเอนต์คาดหวัง
               - ทำให้คลาสที่ไม่สามารถทำงานร่วมกันได้ ทำงานร่วมกันได้
           
           2.2 Composite Pattern
               - จัดการกับวัตถุแบบต้นไม้
               - ให้ไคลเอนต์สามารถจัดการกับวัตถุเดี่ยวและกลุ่มของวัตถุได้เหมือนกัน
               - ใช้กับโครงสร้างแบบลำดับชั้น เช่น แฟ้มและโฟลเดอร์
           
           2.3 Proxy Pattern
               - ให้วัตถุแทนทำหน้าที่แทนวัตถุอื่น
               - ควบคุมการเข้าถึงวัตถุต้นฉบับ
               - ใช้สำหรับการโหลดข้อมูลแบบ lazy loading หรือการตรวจสอบสิทธิ์
        
        3. รูปแบบพฤติกรรม (Behavioral Patterns)
           - เกี่ยวข้องกับการสื่อสารระหว่างวัตถุ
           - กำหนดรูปแบบการสื่อสารที่ดี
           
           3.1 Observer Pattern
               - กำหนดความสัมพันธ์แบบหนึ่งต่อหลายระหว่างวัตถุ
               - เมื่อวัตถุหลักเปลี่ยนสถานะ วัตถุที่ขึ้นต่อจะได้รับแจ้งและอัปเดตโดยอัตโนมัติ
               - ใช้ในสถาปัตยกรรม MVC (Model-View-Controller)
           
           3.2 Strategy Pattern
               - กำหนดกลุ่มของอัลกอริทึมที่สามารถสลับกันได้
               - ทำให้อัลกอริทึมเป็นอิสระจากไคลเอนต์ที่ใช้
               - ใช้เมื่อต้องการเปลี่ยนพฤติกรรมของวัตถุในเวลารันไทม์
           
           3.3 Command Pattern
               - แปลงคำขอให้เป็นวัตถุ
               - สามารถพารามิเตอร์การทำงานได้
               - สามารถจัดคิว หรือบันทึกคำขอได้
               - รองรับการเลิกทำ (undo)
        """
        
        # อัปโหลดเฉลย
        if not self.upload_answer_key(answer_key_content, question_id):
            return {"status": "failed", "reason": "upload_failed"}
        
        # คำถามสำหรับทดสอบ
        question = "อธิบาย Singleton Pattern และการนำไปใช้งาน"
        
        # คำตอบที่แตกต่างกัน
        test_answers = [
            {
                "description": "คำตอบที่ถูกต้องและสมบูรณ์",
                "answer": """
                Singleton Pattern คือรูปแบบการออกแบบที่รับประกันว่าคลาสจะมีอินสแตนซ์เพียงตัวเดียวและให้การเข้าถึงแบบ global ต่ออินสแตนซ์นั้น
                
                การนำไปใช้:
                1. ในระบบ logging เพื่อให้มีจุดเข้าถึงเพียงจุดเดียว
                2. ในการจัดการ connection pool เพื่อจำกัดการใช้ทรัพยากร
                3. ใช้กับ driver objects ที่ต้องการเพียงอินสแตนซ์เดียว
                4. ใช้ในการทำ caching เพื่อจัดการหน่วยความจำอย่างมีประสิทธิภาพ
                
                ตัวอย่างโค้ด:
                ```
                public class Singleton {
                   private static Singleton instance;
                   
                   private Singleton() {}
                   
                   public static synchronized Singleton getInstance() {
                      if (instance == null) {
                         instance = new Singleton();
                      }
                      return instance;
                   }
                }
                ```
                """
            },
            {
                "description": "คำตอบที่ถูกต้องแต่ไม่สมบูรณ์",
                "answer": """
                Singleton Pattern ทำให้คลาสมีอินสแตนซ์เพียงตัวเดียว และให้เข้าถึงได้จากทุกที่ในโปรแกรม
                
                ใช้กับการทำ logging หรือเมื่อต้องการจำกัดการสร้างวัตถุเพียงตัวเดียวเพื่อประหยัดทรัพยากร
                """
            },
            {
                "description": "คำตอบที่มีข้อผิดพลาด",
                "answer": """
                Singleton Pattern คือการสร้างวัตถุหลายตัวที่มีคุณสมบัติเหมือนกัน ทำให้ระบบมีความยืดหยุ่นมากขึ้น
                
                ใช้กับการสร้างวัตถุจำนวนมากที่ต้องการประหยัดหน่วยความจำ เช่น การสร้างตัวละครในเกม
                """
            },
            {
                "description": "คำตอบที่ไม่เกี่ยวข้อง",
                "answer": """
                การเขียนโปรแกรมเชิงวัตถุมีประโยชน์มากในการพัฒนาซอฟต์แวร์ ทำให้โค้ดมีความเป็นระเบียบและนำกลับมาใช้ใหม่ได้
                """
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_answers, 1):
            print(f"\nทดสอบคำตอบแบบที่ {i}: {test_case['description']}")
            print(f"คำตอบ: {test_case['answer'][:100]}...")
            
            # ประเมินคำตอบ
            result = self.evaluate_answer(
                question,
                test_case['answer'],
                question_id
            )
            
            if result:
                # บันทึกผลลัพธ์
                case_result = {
                    "description": test_case['description'],
                    "answer": test_case['answer'],
                    "evaluation": result['evaluation'],
                    "score": result['score'],
                    "processing_time": result.get('processing_time', 0)
                }
                
                results.append(case_result)
                print(f"  คะแนนที่ได้: {result['score']}/10")
                print(f"  เวลาที่ใช้: {result.get('processing_time', 0):.2f} วินาที")
        
        # วิเคราะห์ความสอดคล้องของการประเมิน
        if len(results) >= 2:
            # ตรวจสอบว่าคะแนนสอดคล้องกับความคาดหวังหรือไม่
            expected_order = [0, 1, 2, 3]  # คำตอบที่ดีที่สุดควรได้คะแนนมากกว่า
            actual_order = sorted(range(len(results)), key=lambda i: results[i]['score'], reverse=True)
            
            order_correct = (expected_order == actual_order)
            
            # คำนวณความแตกต่างของคะแนน
            score_diffs = []
            for i in range(len(results) - 1):
                for j in range(i + 1, len(results)):
                    score_diffs.append(abs(results[i]['score'] - results[j]['score']))
            
            avg_score_diff = sum(score_diffs) / len(score_diffs) if score_diffs else 0
            
            # คำนวณเวลาเฉลี่ย
            avg_time = sum(r.get('processing_time', 0) for r in results) / len(results)
            
            # สรุปผล
            summary = {
                "status": "success",
                "order_correct": order_correct,
                "avg_score_diff": avg_score_diff,
                "avg_processing_time": avg_time,
                "details": results
            }
            
            print(f"\nการจัดลำดับคะแนนถูกต้อง (Correct Order): {'✅ Yes' if order_correct else '❌ No'}")
            print(f"ความแตกต่างของคะแนนเฉลี่ย (Avg Score Difference): {avg_score_diff:.2f}")
            print(f"เวลาประมวลผลเฉลี่ย (Avg Processing Time): {avg_time:.2f} วินาที")
            
            # บันทึกผลการทดสอบ
            self.test_results["answer_variability"] = summary
            
            return summary
        else:
            return {"status": "failed", "reason": "insufficient_results"}
    
    def test_performance(self):
        """
        ทดสอบความเร็วและการใช้ทรัพยากร
        
        Returns:
            dict: ผลการทดสอบ
        """
        print("\n=== ทดสอบความเร็วและการใช้ทรัพยากร ===")
        question_id = "PERFORMANCE_TEST"
        
        # เนื้อหาเฉลยสั้นๆ
        answer_key_content = """
        แนวคิดการพัฒนาซอฟต์แวร์แบบอไจล์ (Agile Software Development)
        
        การพัฒนาซอฟต์แวร์แบบอไจล์เป็นแนวทางในการพัฒนาซอฟต์แวร์ที่เน้นความยืดหยุ่น การปรับตัว และการส่งมอบอย่างต่อเนื่อง โดยมีหลักการสำคัญตาม Agile Manifesto ดังนี้:
        
        1. บุคคลและการมีปฏิสัมพันธ์มีความสำคัญมากกว่ากระบวนการและเครื่องมือ
        2. ซอฟต์แวร์ที่ทำงานได้มีความสำคัญมากกว่าเอกสารที่ครอบคลุม
        3. การร่วมมือกับลูกค้ามีความสำคัญมากกว่าการเจรจาต่อรองตามสัญญา
        4. การตอบสนองต่อการเปลี่ยนแปลงมีความสำคัญมากกว่าการทำตามแผน
        
        วิธีการพัฒนาแบบอไจล์ที่นิยมใช้:
        - Scrum: ใช้การทำงานเป็น Sprint (2-4 สัปดาห์) มี Scrum Master, Product Owner, และ Development Team
        - Kanban: เน้นการมองเห็นงาน จำกัด WIP (Work in Progress) และการไหลของงาน
        - XP (Extreme Programming): เน้นการเขียนทดสอบก่อน (TDD) การทำ Pair Programming และการปรับปรุงโค้ดอย่างต่อเนื่อง
        """
        
        # อัปโหลดเฉลย
        if not self.upload_answer_key(answer_key_content, question_id):
            return {"status": "failed", "reason": "upload_failed"}
        
        # คำถามและคำตอบสำหรับทดสอบ
        test_cases = [
            {
                "question": "อธิบายหลักการสำคัญของ Agile Manifesto",
                "answer": "Agile Manifesto เน้นบุคคลและปฏิสัมพันธ์มากกว่ากระบวนการ, ซอฟต์แวร์ที่ทำงานได้มากกว่าเอกสาร, การร่วมมือกับลูกค้ามากกว่าสัญญา, และการตอบสนองต่อการเปลี่ยนแปลงมากกว่าการทำตามแผน"
            }
        ]
        
        # เก็บผลการทดสอบความเร็ว
        processing_times = []
        results = []
        
        # ทดสอบความเร็วโดยรัน 5 ครั้ง
        for i in range(5):
            test_case = test_cases[0]  # ใช้เคสเดียวซ้ำๆ เพื่อวัดความเร็ว
            
            print(f"\nรอบที่ {i+1}/5:")
            print(f"คำถาม: {test_case['question']}")
            
            # จับเวลาการประมวลผล
            start_time = time.time()
            
            # ประเมินคำตอบ
            result = self.evaluate_answer(
                test_case['question'],
                test_case['answer'],
                question_id
            )
            
            if result:
                # คำนวณเวลาที่ใช้
                elapsed_time = time.time() - start_time
                processing_times.append(elapsed_time)
                
                # บันทึกผลลัพธ์
                case_result = {
                    "question": test_case['question'],
                    "answer": test_case['answer'],
                    "evaluation": result['evaluation'],
                    "score": result['score'],
                    "processing_time": elapsed_time
                }
                
                results.append(case_result)
                print(f"  คะแนนที่ได้: {result['score']}/10")
                print(f"  เวลาที่ใช้: {elapsed_time:.2f} วินาที")
                
        # คำนวณสถิติของเวลาที่ใช้
        if processing_times:
            avg_time = sum(processing_times) / len(processing_times)
            min_time = min(processing_times)
            max_time = max(processing_times)
            std_dev = (sum((t - avg_time) ** 2 for t in processing_times) / len(processing_times)) ** 0.5
            
            # สรุปผล
            summary = {
                "status": "success",
                "avg_processing_time": avg_time,
                "min_processing_time": min_time,
                "max_processing_time": max_time,
                "std_dev_processing_time": std_dev,
                "details": results
            }
            
            print(f"\nเวลาประมวลผลเฉลี่ย (Avg Processing Time): {avg_time:.2f} วินาที")
            print(f"เวลาประมวลผลเร็วที่สุด (Min Processing Time): {min_time:.2f} วินาที")
            print(f"เวลาประมวลผลช้าที่สุด (Max Processing Time): {max_time:.2f} วินาที")
            print(f"ส่วนเบี่ยงเบนมาตรฐานของเวลา (Std Dev): {std_dev:.2f} วินาที")
            
            # บันทึกผลการทดสอบ
            self.test_results["performance"] = summary
            
            return summary
        else:
            return {"status": "failed", "reason": "no_results"}
    
    def generate_summary_report(self):
        """
        สร้างรายงานสรุปผลการทดสอบทั้งหมด
        
        Returns:
            dict: รายงานสรุป
        """
        print("\n" + "=" * 60)
        print(" " * 20 + "สรุปผลการทดสอบ RAG")
        print("=" * 60)
        
        # สร้างรายงานสรุป
        summary = {
            "test_id": self.subject_id,
            "test_date": self.test_date,
            "results": self.test_results
        }
        
        # คำนวณคะแนนรวม
        scores = {}
        
        # 1. ความแม่นยำในการค้นคืน
        if "retrieval_accuracy" in self.test_results and self.test_results["retrieval_accuracy"].get("status") == "success":
            scores["retrieval_accuracy"] = self.test_results["retrieval_accuracy"]["avg_precision"] * 100
        else:
            scores["retrieval_accuracy"] = 0
        
        # 2. ความเข้าใจบริบท
        if "contextual_understanding" in self.test_results and self.test_results["contextual_understanding"].get("status") == "success":
            scores["contextual_understanding"] = self.test_results["contextual_understanding"]["avg_context_accuracy"] * 100
        else:
            scores["contextual_understanding"] = 0
        
        # 3. ประสิทธิภาพกับภาษาไทย
        if "thai_language" in self.test_results and self.test_results["thai_language"].get("status") == "success":
            scores["thai_language"] = self.test_results["thai_language"]["avg_thai_accuracy"] * 100
        else:
            scores["thai_language"] = 0
        
        # 4. การประเมินคำตอบที่แตกต่าง
        if "answer_variability" in self.test_results and self.test_results["answer_variability"].get("status") == "success":
            scores["answer_variability"] = 100 if self.test_results["answer_variability"]["order_correct"] else 50
        else:
            scores["answer_variability"] = 0
        
        # 5. ประสิทธิภาพด้านความเร็ว
        if "performance" in self.test_results and self.test_results["performance"].get("status") == "success":
            # ให้คะแนนตามเวลาที่ใช้ (ยิ่งเร็วยิ่งได้คะแนนมาก, โดยกำหนดเกณฑ์ไว้ที่ 3 วินาที = 100 คะแนน)
            avg_time = self.test_results["performance"]["avg_processing_time"]
            if avg_time <= 3:
                perf_score = 100
            elif avg_time <= 5:
                perf_score = 80
            elif avg_time <= 10:
                perf_score = 60
            else:
                perf_score = 40
            scores["performance"] = perf_score
        else:
            scores["performance"] = 0
        
        # คำนวณคะแนนรวม
        total_score = sum(scores.values()) / len(scores)
        scores["total"] = total_score
        
        # เพิ่มคะแนนในรายงาน
        summary["scores"] = scores
        
        # กำหนดเกรด
        if total_score >= 90:
            grade = "A"
        elif total_score >= 80:
            grade = "B"
        elif total_score >= 70:
            grade = "C"
        elif total_score >= 60:
            grade = "D"
        else:
            grade = "F"
        
        summary["grade"] = grade
        
        # แสดงผลสรุป (ใช้ภาษาไทยคู่กับภาษาอังกฤษเพื่อให้เข้าใจง่าย)
        print("\nคะแนนสรุป (Summary Scores):")
        print(f"1. ความแม่นยำในการค้นคืน (Retrieval Accuracy): {scores['retrieval_accuracy']:.2f}/100 คะแนน")
        print(f"2. ความเข้าใจบริบท (Contextual Understanding): {scores['contextual_understanding']:.2f}/100 คะแนน")
        print(f"3. ประสิทธิภาพกับภาษาไทย (Thai Language Performance): {scores['thai_language']:.2f}/100 คะแนน")
        print(f"4. การประเมินคำตอบที่แตกต่าง (Answer Evaluation): {scores['answer_variability']:.2f}/100 คะแนน")
        print(f"5. ประสิทธิภาพด้านความเร็ว (Performance Speed): {scores['performance']:.2f}/100 คะแนน")
        print(f"\nคะแนนรวม (Total Score): {scores['total']:.2f}/100 คะแนน")
        print(f"เกรด (Grade): {grade}")
        
        # บันทึกรายงานเป็นไฟล์
        report_file = self.results_dir / "summary_report.json"
        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"\nบันทึกรายงานสรุปไปยัง: {report_file}")
        
        # สร้างรายงานกราฟ
        self.generate_graphs(scores)
        
        return summary
    
    def generate_graphs(self, scores):
        """
        สร้างกราฟสรุปผลการทดสอบ
        
        Args:
            scores: คะแนนสรุป
        """
        try:
            # สร้างโฟลเดอร์สำหรับกราฟ
            graphs_dir = self.results_dir / "graphs"
            graphs_dir.mkdir(exist_ok=True)
            
            # 1. กราฟคะแนนรายด้าน (ใช้ภาษาอังกฤษเพื่อความเข้ากันได้กับไลบรารีกราฟิก)
            categories = [
                "Retrieval Accuracy",
                "Contextual Understanding",
                "Thai Language Performance",
                "Answer Evaluation Variability",
                "Performance Speed"
            ]
            
            values = [
                scores["retrieval_accuracy"],
                scores["contextual_understanding"],
                scores["thai_language"],
                scores["answer_variability"],
                scores["performance"]
            ]
            
            # สร้างกราฟแท่ง
            plt.figure(figsize=(12, 8))
            bars = plt.bar(categories, values, color='skyblue')
            
            # เพิ่มค่าบนกราฟแท่ง
            for bar in bars:
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height + 1,
                        f'{height:.2f}', ha='center', va='bottom')
            
            plt.ylim(0, 110)
            plt.xlabel('Test Categories')
            plt.ylabel('Score (out of 100)')
            plt.title('RAG Performance by Category')
            plt.xticks(rotation=15)
            plt.tight_layout()
            
            # บันทึกกราฟ
            plt.savefig(graphs_dir / "category_scores.png")
            
            # 2. กราฟเรดาร์ (ใช้ภาษาอังกฤษเพื่อความเข้ากันได้กับไลบรารีกราฟิก)
            categories = ["Retrieval Accuracy", "Contextual Understanding", 
                         "Thai Language Performance", "Answer Evaluation Variability", 
                         "Performance Speed"]
            
            values = [
                scores["retrieval_accuracy"]/100,
                scores["contextual_understanding"]/100,
                scores["thai_language"]/100,
                scores["answer_variability"]/100,
                scores["performance"]/100
            ]
            
            # ทำให้เป็นวงกลม (เพิ่มค่าแรกต่อท้าย)
            categories = categories + [categories[0]]
            values = values + [values[0]]
            
            # แปลงเป็นองศา
            N = len(categories) - 1
            angles = [n / float(N) * 2 * np.pi for n in range(N)]
            angles += angles[:1]
            
            # สร้างกราฟเรดาร์
            plt.figure(figsize=(10, 10))
            ax = plt.subplot(111, polar=True)
            
            # เส้นขอบ
            plt.plot(angles, values, linewidth=2, linestyle='solid', label="คะแนน")
            
            # พื้นที่
            plt.fill(angles, values, alpha=0.25)
            
            # เพิ่มป้ายกำกับ
            plt.xticks(angles[:-1], categories[:-1], size=12)
            
            # ปรับแต่งเพิ่มเติม
            ax.set_rlabel_position(0)
            plt.yticks([0.2, 0.4, 0.6, 0.8, 1.0], ["20%", "40%", "60%", "80%", "100%"], color="grey", size=10)
            plt.ylim(0, 1)
            
            plt.title("RAG Test Results", size=16)
            
            # บันทึกกราฟ
            plt.savefig(graphs_dir / "radar_chart.png")
            
            print(f"สร้างกราฟสรุปผลสำเร็จที่: {graphs_dir}")
        
        except Exception as e:
            print(f"ไม่สามารถสร้างกราฟได้: {str(e)}")
    
    def run_all_tests(self):
        """
        รันการทดสอบทั้งหมด
        
        Returns:
            dict: รายงานสรุป
        """
        print("\n" + "=" * 60)
        print(" " * 15 + "เริ่มการทดสอบ RAG ทุกด้าน")
        print("=" * 60)
        
        # 1. ทดสอบความแม่นยำในการค้นคืน
        self.test_retrieval_accuracy()
        
        # 2. ทดสอบความเข้าใจบริบท
        self.test_contextual_understanding()
        
        # 3. ทดสอบประสิทธิภาพกับภาษาไทย
        self.test_thai_language()
        
        # 4. ทดสอบการประเมินคำตอบที่แตกต่าง
        self.test_answer_variability()
        
        # 5. ทดสอบความเร็ว
        self.test_performance()
        
        # สร้างรายงานสรุป
        return self.generate_summary_report()

def main():
    """ฟังก์ชันหลักสำหรับรันการทดสอบ"""
    load_dotenv()  # โหลดตัวแปรจาก .env
    
    print("=" * 60)
    print(" " * 15 + "ระบบทดสอบประสิทธิภาพ RAG")
    print("=" * 60)
    
    try:
        # ตรวจสอบการเชื่อมต่อ API หรือใช้โดยตรง
        use_api = input("ใช้งานผ่าน API หรือไม่? (y/n): ").strip().lower() == 'y'
        
        if use_api:
            api_url = input("ระบุ API URL (default: http://localhost:8000): ").strip()
            if not api_url:
                api_url = "http://localhost:8000"
            
            # ทดสอบการเชื่อมต่อ
            try:
                response = requests.get(f"{api_url}/")
                if response.status_code == 200:
                    print(f"✅ เชื่อมต่อ API สำเร็จ: {api_url}")
                else:
                    print(f"⚠️ API ตอบสนองด้วยสถานะ: {response.status_code}")
                    continue_anyway = input("ต้องการดำเนินการต่อหรือไม่? (y/n): ").strip().lower() == 'y'
                    if not continue_anyway:
                        return
            except Exception as e:
                print(f"❌ ไม่สามารถเชื่อมต่อกับ API ได้: {str(e)}")
                use_api_anyway = input("ต้องการใช้งานผ่าน API ต่อหรือไม่? (y/n): ").strip().lower() == 'y'
                if not use_api_anyway:
                    use_api = False
        
        # สร้างตัวทดสอบ
        tester = RAGTester(api_base_url=api_url if use_api else None, use_api=use_api)
        
        # เลือกโหมดการทดสอบ
        print("\nเลือกโหมดการทดสอบ:")
        print("1. ทดสอบทั้งหมด")
        print("2. ทดสอบความแม่นยำในการค้นคืน")
        print("3. ทดสอบความเข้าใจบริบท")
        print("4. ทดสอบประสิทธิภาพกับภาษาไทย")
        print("5. ทดสอบการประเมินคำตอบที่แตกต่าง")
        print("6. ทดสอบความเร็ว")
        
        mode = input("\nเลือกโหมด (1-6): ").strip()
        
        if mode == "1":
            tester.run_all_tests()
        elif mode == "2":
            tester.test_retrieval_accuracy()
        elif mode == "3":
            tester.test_contextual_understanding()
        elif mode == "4":
            tester.test_thai_language()
        elif mode == "5":
            tester.test_answer_variability()
        elif mode == "6":
            tester.test_performance()
        else:
            print("โหมดไม่ถูกต้อง")
            return
        
        # ถ้าไม่ได้ทดสอบทั้งหมด ให้สร้างรายงานสรุป
        if mode != "1":
            tester.generate_summary_report()
        
    except KeyboardInterrupt:
        print("\nยกเลิกการทดสอบ")
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาด: {str(e)}")
    
    print("\n" + "=" * 60)
    print(" " * 20 + "การทดสอบเสร็จสิ้น")
    print("=" * 60)

if __name__ == "__main__":
    main()