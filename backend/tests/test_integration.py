# backend/tests/test_integration.py
import os
import uuid
import time
import subprocess
import signal
import sys
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

# โหลดตัวแปรสภาพแวดล้อม
load_dotenv()

# กำหนดค่าคงที่สำหรับการทดสอบ
API_URL = "http://localhost:8000"
TEST_SUBJECT_ID = "CS101"
TEST_QUESTION_ID = "Q1" 

def start_api_server():
    """เริ่มต้น FastAPI server สำหรับทดสอบ (เวอร์ชัน Windows)"""
    # หาพาธของไฟล์ main.py
    backend_dir = Path(__file__).parent.parent
    main_path = backend_dir / "app" / "main.py"
    
    print(f"กำลังเริ่มต้น FastAPI server ที่ {main_path}...")
    
    # เริ่ม API server ด้วย uvicorn
    # ใช้ creationflags สำหรับ Windows แทน preexec_fn ของ Linux
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", f"{main_path.stem}:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(backend_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
    )
    
    # รอให้ server เริ่มต้น
    time.sleep(5)
    
    return process

def stop_api_server(process):
    """หยุดการทำงานของ FastAPI server (เวอร์ชัน Windows)"""
    print("กำลังหยุด FastAPI server...")
    if os.name == 'nt':  # Windows
        # ส่ง CTRL+BREAK signal บน Windows
        process.send_signal(signal.CTRL_BREAK_EVENT)
    else:  # Linux/Unix
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        
    # รอให้โปรเซสปิดตัว
    process.wait(timeout=5)
    print("หยุด FastAPI server เรียบร้อยแล้ว")

def check_api_health():
    """ตรวจสอบว่า API พร้อมใช้งานหรือไม่"""
    try:
        response = requests.get(f"{API_URL}/")
        if response.status_code == 200:
            print(f"API พร้อมใช้งาน: {response.json()['message']}")
            return True
        else:
            print(f"API ไม่พร้อมใช้งาน: รหัสสถานะ {response.status_code}")
            return False
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ API: {str(e)}")
        return False

def test_upload_answer_key():
    """ทดสอบการอัปโหลดเฉลย"""
    print("\n=== ทดสอบการอัปโหลดเฉลย ===")
    
    # สร้างไฟล์เฉลยทดสอบ
    test_file_path = "test_answer_key.txt"
    with open(test_file_path, "w", encoding="utf-8") as f:
        f.write("""
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
        """)
    
    # ส่งคำขออัปโหลดไฟล์
    try:
        with open(test_file_path, "rb") as f:
            files = {"file": f}
            data = {"subject_id": TEST_SUBJECT_ID, "question_id": TEST_QUESTION_ID}
            response = requests.post(f"{API_URL}/api/evaluation/upload-answer-key", files=files, data=data)
        
        # ลบไฟล์ทดสอบ
        os.remove(test_file_path)
        
        # ตรวจสอบผลลัพธ์
        if response.status_code == 200:
            result = response.json()
            print(f"อัปโหลดเฉลยสำเร็จ: {result['message']}")
            return True
        else:
            print(f"อัปโหลดเฉลยไม่สำเร็จ: รหัสสถานะ {response.status_code}")
            print(f"ข้อความผิดพลาด: {response.text}")
            return False
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการอัปโหลดเฉลย: {str(e)}")
        return False

def test_evaluate_answer():
    """ทดสอบการประเมินคำตอบนักศึกษา"""
    print("\n=== ทดสอบการประเมินคำตอบนักศึกษา ===")
    
    # ข้อมูลสำหรับการทดสอบ
    data = {
        "question": "อธิบายหลักการ SOLID ในการออกแบบซอฟต์แวร์",
        "student_answer": """
        หลักการ SOLID ประกอบด้วย
        1. S - Single Responsibility คือคลาสควรมีหน้าที่เดียว
        2. O - Open/Closed คือเปิดให้ขยาย ปิดให้แก้ไข
        3. L - Liskov คือคลาสลูกต้องแทนที่คลาสแม่ได้
        4. I - Interface Segregation คือแยกอินเทอร์เฟซให้เฉพาะ
        5. D - Dependency Inversion คือขึ้นต่อนามธรรมไม่ใช่รูปธรรม
        """,
        "subject_id": TEST_SUBJECT_ID,
        "question_id": TEST_QUESTION_ID
    }
    
    try:
        # ส่งคำขอประเมินคำตอบ
        response = requests.post(f"{API_URL}/api/evaluation/evaluate", json=data)
        
        # ตรวจสอบผลลัพธ์
        if response.status_code == 200:
            result = response.json()
            print(f"ประเมินคำตอบสำเร็จ")
            print(f"คะแนน: {result['score']}")
            print(f"การประเมิน: {result['evaluation'][:200]}...")  # แสดงเฉพาะส่วนต้นของการประเมิน
            return True
        else:
            print(f"ประเมินคำตอบไม่สำเร็จ: รหัสสถานะ {response.status_code}")
            print(f"ข้อความผิดพลาด: {response.text}")
            return False
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการประเมินคำตอบ: {str(e)}")
        return False

def run_integration_test():
    """ดำเนินการทดสอบแบบบูรณาการทั้งหมด"""
    print("=== เริ่มการทดสอบแบบบูรณาการ ===\n")
    
    api_process = None
    
    try:
        # เริ่ม API server
        api_process = start_api_server()
        
        # ตรวจสอบว่า API พร้อมใช้งานหรือไม่
        if not check_api_health():
            print("ไม่สามารถเชื่อมต่อกับ API ได้ การทดสอบถูกยกเลิก")
            return False
        
        # ทดสอบการอัปโหลดเฉลย
        if not test_upload_answer_key():
            print("การทดสอบการอัปโหลดเฉลยไม่สำเร็จ การทดสอบถูกยกเลิก")
            return False
        
        # ทดสอบการประเมินคำตอบ
        if not test_evaluate_answer():
            print("การทดสอบการประเมินคำตอบไม่สำเร็จ")
            return False
        
        print("\n=== การทดสอบแบบบูรณาการเสร็จสิ้น: สำเร็จ! ===")
        return True
        
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการทดสอบแบบบูรณาการ: {str(e)}")
        return False
        
    finally:
        # หยุด API server
        if api_process:
            try:
                stop_api_server(api_process)
            except Exception as e:
                print(f"เกิดข้อผิดพลาดในการหยุด API server: {str(e)}")
                print("คุณอาจต้องปิดโปรเซส uvicorn ด้วยตนเอง")

if __name__ == "__main__":
    run_integration_test()