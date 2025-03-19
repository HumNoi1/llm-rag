# backend/tests/test_pdf.py
import os
import tempfile
import requests
import pytest
from reportlab.pdfgen import canvas
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from backend.app.main import app

# โหลดตัวแปรสภาพแวดล้อม
load_dotenv()

# สร้าง test client
client = TestClient(app)

def create_test_pdf(content):
    """สร้างไฟล์ PDF ทดสอบ"""
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        pdf_path = temp_file.name
    
    # สร้าง PDF โดยใช้ reportlab
    pdf = canvas.Canvas(pdf_path)
    y_position = 800  # เริ่มต้นจากด้านบนของหน้า
    
    # แบ่งเนื้อหาเป็นบรรทัด
    lines = content.split('\n')
    for line in lines:
        if line.strip():  # ข้ามบรรทัดว่าง
            pdf.drawString(50, y_position, line)
            y_position -= 20  # เลื่อนลงสำหรับบรรทัดถัดไป
    
    pdf.save()
    return pdf_path

def test_upload_pdf_answer_key():
    """ทดสอบการอัปโหลดไฟล์ PDF เป็นเฉลย"""
    # สร้างเนื้อหาเฉลย
    content = """
    แนวคิดการออกแบบซอฟต์แวร์ที่ดี (Good Software Design Principles):
    
    1. หลักการ SOLID:
       - Single Responsibility Principle: คลาสควรมีหน้าที่รับผิดชอบเพียงอย่างเดียว
       - Open/Closed Principle: ซอฟต์แวร์ควรเปิดให้ขยายได้ แต่ปิดการแก้ไข
       - Liskov Substitution Principle: คลาสลูกควรแทนที่คลาสแม่ได้โดยไม่มีปัญหา
       - Interface Segregation Principle: อินเทอร์เฟซควรเฉพาะเจาะจงกับผู้ใช้
       - Dependency Inversion Principle: เชื่อมต่อกับนามธรรม ไม่ใช่คลาสจริง
    """
    
    # สร้างไฟล์ PDF
    pdf_path = create_test_pdf(content)
    
    try:
        # เตรียมข้อมูลสำหรับการอัปโหลด
        with open(pdf_path, 'rb') as pdf_file:
            files = {'file': (os.path.basename(pdf_path), pdf_file, 'application/pdf')}
            data = {'subject_id': 'TEST101', 'question_id': 'Q1'}
            
            # ส่งคำขออัปโหลด
            response = client.post('/api/evaluation/upload-answer-key', files=files, data=data)
        
        # ตรวจสอบการตอบกลับ
        assert response.status_code == 200
        json_response = response.json()
        assert 'message' in json_response
        assert 'PDF' in json_response['message']
        assert json_response['file_type'] == 'PDF'
        assert json_response['chunks'] > 0
        
        # ทดสอบประเมินคำตอบหลังจากอัปโหลดเฉลย PDF
        eval_data = {
            'question': 'อธิบายหลักการ SOLID',
            'student_answer': 'SOLID คือหลักการออกแบบซอฟต์แวร์ประกอบด้วย S - Single Responsibility, O - Open/Closed, L - Liskov Substitution, I - Interface Segregation, D - Dependency Inversion',
            'subject_id': 'TEST101',
            'question_id': 'Q1'
        }
        
        eval_response = client.post('/api/evaluation/evaluate', json=eval_data)
        assert eval_response.status_code == 200
        eval_result = eval_response.json()
        assert 'evaluation' in eval_result
        assert 'score' in eval_result
        
    finally:
        # ลบไฟล์ PDF ทดสอบ
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)

if __name__ == "__main__":
    # ทดสอบการอัปโหลด PDF
    test_upload_pdf_answer_key()