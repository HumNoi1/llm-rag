# backend/tests/test_groq.py
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

# โหลดตัวแปรสภาพแวดล้อมจาก .env
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL_NAME = os.getenv("GROQ_MODEL_NAME", "deepseek-r1-distill-llama-70b")

def test_groq_connection():
    """ทดสอบการเชื่อมต่อกับ Groq API"""
    
    # สร้าง instance ของ ChatGroq
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name=GROQ_MODEL_NAME,
        temperature=0.1
    )
    
    # ทดสอบส่งคำถามง่ายๆ
    response = llm.invoke("อะไรคือแนวคิดของ SOLID ในการออกแบบซอฟต์แวร์?")
    
    # พิมพ์ผลลัพธ์
    print("Groq Response:")
    print(response.content)
    
    # ตรวจสอบว่าได้รับคำตอบจริง
    assert len(response.content) > 0, "ไม่ได้รับคำตอบจาก Groq API"
    
if __name__ == "__main__":
    test_groq_connection()