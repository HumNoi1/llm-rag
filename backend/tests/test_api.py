# backend/tests/test_api.py
import os
import requests
import time
import subprocess
import signal
import sys
from pathlib import Path

# กำหนด URL ของ API
API_URL = "http://localhost:8000"

def start_api_server():
    """เริ่มต้น FastAPI server สำหรับทดสอบ"""
    # หาพาธของไฟล์ main.py
    backend_dir = Path(__file__).parent.parent
    main_path = backend_dir / "app" / "main.py"
    
    # เริ่ม API server ด้วย uvicorn
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", f"{main_path.stem}:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(backend_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid  # ให้สามารถหยุดการทำงานได้ทั้งกลุ่ม
    )
    
    # รอให้ server เริ่มต้น
    time.sleep(5)
    
    return process

def stop_api_server(process):
    """หยุดการทำงานของ FastAPI server"""
    os.killpg(os.getpgid(process.pid), signal.SIGTERM)

def test_root_endpoint():
    """ทดสอบ root endpoint"""
    response = requests.get(f"{API_URL}/")
    assert response.status_code == 200, f"API request failed with status code {response.status_code}"
    data = response.json()
    assert "message" in data, "Response does not contain 'message' field"
    print(f"Root endpoint test passed: {data['message']}")

def test_upload_answer_key():
    """ทดสอบ upload-answer-key endpoint"""
    endpoint = f"{API_URL}/api/evaluation/upload-answer-key"
    
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
    
    response = requests.post(endpoint, files=files, data=data)
    
    # ปิดไฟล์
    files["file"].close()
    
    # ลบไฟล์ทดสอบ
    os.remove("test_answer_key.txt")
    
    assert response.status_code == 200, f"API request failed with status code {response.status_code}"
    data = response.json()
    assert "message" in data, "Response does not contain 'message' field"
    print(f"Upload answer key test passed: {data['message']}")

def test_evaluate_answer():
    """ทดสอบ evaluate endpoint"""
    endpoint = f"{API_URL}/api/evaluation/evaluate"
    
    data = {
        "question": "อธิบายหลักการ SOLID ในการออกแบบซอฟต์แวร์",
        "student_answer": "หลักการ SOLID ประกอบด้วย S - Single Responsibility, O - Open/Closed, L - Liskov Substitution, I - Interface Segregation, และ D - Dependency Inversion",
        "subject_id": "CS101",
        "question_id": "Q1"
    }
    
    response = requests.post(endpoint, json=data)
    
    assert response.status_code == 200, f"API request failed with status code {response.status_code}"
    result = response.json()
    assert "evaluation" in result, "Response does not contain 'evaluation' field"
    assert "score" in result, "Response does not contain 'score' field"
    
    print(f"Evaluate answer test passed")
    print(f"Score: {result['score']}")
    print(f"Evaluation: {result['evaluation']}")

if __name__ == "__main__":
    # เริ่ม API server
    server_process = start_api_server()
    
    try:
        # ทดสอบ endpoints
        test_root_endpoint()
        test_upload_answer_key()
        test_evaluate_answer()
    finally:
        # หยุด API server
        stop_api_server(server_process)