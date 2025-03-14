# tests/test_end_to_end.py
import os
import requests
import time
import subprocess
import signal
import sys
import shutil
from pathlib import Path

# กำหนด URL ของ API
API_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def start_backend():
    """เริ่มต้น FastAPI server"""
    backend_dir = Path(__file__).parent.parent / "backend"
    main_path = backend_dir / "app" / "main.py"
    
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", f"{main_path.stem}:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(backend_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid
    )
    
    # รอให้ server เริ่มต้น
    time.sleep(5)
    
    return process

def start_frontend():
    """เริ่มต้น Next.js frontend"""
    frontend_dir = Path(__file__).parent.parent / "frontend"
    
    process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(frontend_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid
    )
    
    # รอให้ frontend เริ่มต้น
    time.sleep(10)
    
    return process

def stop_process(process):
    """หยุดการทำงานของ process"""
    if process:
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)

def test_complete_workflow():
    """ทดสอบการทำงานทั้งระบบ"""
    print("=== ทดสอบการทำงานร่วมกันแบบ End-to-End ===\n")
    
    # 1. อัปโหลดเฉลย
    print("1. อัปโหลดไฟล์เฉลย")
    
    # สร้างไฟล์เฉลยทดสอบ
    with open("test_answer_key.txt", "w", encoding="utf-8") as f:
        f.write("""
        แนวคิดการออกแบบซอฟต์แวร์ที่ดี (Good Software Design Principles):
        
        1. หลักการ SOLID:
           - Single Responsibility Principle: คลาสควรมีหน้าที่รับผิดชอบเพียงอย่างเดียว
           - Open/Closed Principle: ซอฟต์แวร์ควรเปิดให้ขยายได้ แต่ปิดการแก้ไข
           - Liskov Substitution Principle: คลาสลูกควรแทนที่คลาสแม่ได้โดยไม่มีปัญหา
           - Interface Segregation Principle: อินเทอร์เฟซควรเฉพาะเจาะจงกับผู้ใช้
           - Dependency Inversion Principle: เชื่อมต่อกับนามธรรม ไม่ใช่คลาสจริง
        """)
    
    files = {"file": open("test_answer_key.txt", "rb")}
    data = {"subject_id": "CS101", "question_id": "Q1"}
    
    response = requests.post(f"{API_URL}/api/evaluation/upload-answer-key", files=files, data=data)
    
    # ปิดไฟล์
    files["file"].close()
    
    # ลบไฟล์ทดสอบ
    os.remove("test_answer_key.txt")
    
    print(f"ผลลัพธ์: {response.json()['message']}\n")
    
    # 2. ทดสอบการประเมินคำตอบ
    print("2. ทดสอบการประเมินคำตอบนักเรียน")
    
    data = {
        "question": "อธิบายหลักการ SOLID ในการออกแบบซอฟต์แวร์",
        "student_answer": """
        หลักการ SOLID เป็นหลักการออกแบบซอฟต์แวร์ที่สำคัญ ประกอบด้วย:
        S - Single Responsibility คือคลาสต้องมีหน้าที่รับผิดชอบเพียงอย่างเดียว 
        O - Open/Closed คือเปิดให้ขยายได้ แต่ปิดให้แก้ไข
        L - Liskov Substitution คือคลาสลูกต้องสามารถแทนที่คลาสแม่ได้
        I - Interface Segregation คือแยกอินเทอร์เฟซให้เล็กและเฉพาะ
        D - Dependency Inversion คือขึ้นต่อนามธรรมไม่ใช่รูปธรรม
        """,
        "subject_id": "CS101",
        "question_id": "Q1"
    }
    
    response = requests.post(f"{API_URL}/api/evaluation/evaluate", json=data)
    result = response.json()
    
    print(f"คะแนน: {result['score']}")
    print(f"การประเมิน: {result['evaluation']}")

if __name__ == "__main__":
    backend_process = None
    frontend_process = None
    
    try:
        # เริ่ม backend
        print("เริ่มต้น Backend...")
        backend_process = start_backend()
        
        # เริ่ม frontend (ถ้าต้องการทดสอบกับ frontend ด้วย)
        # print("เริ่มต้น Frontend...")
        # frontend_process = start_frontend()
        
        # ทดสอบการทำงานทั้งระบบ
        test_complete_workflow()
        
    finally:
        # หยุดการทำงานของ processes
        if backend_process:
            print("\nหยุดการทำงานของ Backend...")
            stop_process(backend_process)
        
        if frontend_process:
            print("หยุดการทำงานของ Frontend...")
            stop_process(frontend_process)
        
        print("\nการทดสอบเสร็จสิ้น")