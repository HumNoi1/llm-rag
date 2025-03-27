# backend/check_models.py
import os
import sys
from pathlib import Path

# เพิ่มพาธของโปรเจกต์เพื่อให้ import โมดูลได้
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.model_service import ModelService
from app.config import EMBEDDING_MODEL_NAME, GROQ_MODEL_NAME, CHROMA_DB_DIRECTORY

def check_models():
    print("\n===== ตรวจสอบโมเดลที่ใช้งานในระบบ =====")
    
    # แสดงค่าจาก config
    print(f"\nค่าที่กำหนดใน config.py:")
    print(f"- Embedding Model: {EMBEDDING_MODEL_NAME}")
    print(f"- LLM Model: {GROQ_MODEL_NAME}")
    print(f"- ChromaDB Path: {CHROMA_DB_DIRECTORY}")
    
    # สร้าง service เพื่อตรวจสอบโมเดลจริง
    try:
        model_service = ModelService()
        
        # ข้อมูลโมเดล Embedding
        embeddings = model_service.get_embeddings()
        print(f"\nโมเดล Embedding ที่โหลดจริง:")
        print(f"- ชื่อโมเดล: {embeddings.model_name}")
        print(f"- ชนิด: {type(embeddings).__name__}")
        
        # ทดลองสร้าง embedding จากข้อความทดสอบ
        test_text = "ทดสอบภาษาไทย และ English"
        try:
            embed_result = embeddings.embed_query(test_text)
            print(f"- ขนาดของ embedding vector: {len(embed_result)} มิติ")
            print(f"- ตัวอย่าง 5 ค่าแรกของ vector: {embed_result[:5]}")
        except Exception as e:
            print(f"- ไม่สามารถสร้าง embedding ได้: {str(e)}")
        
        # ข้อมูลโมเดล LLM
        llm = model_service.get_llm()
        print(f"\nโมเดล LLM ที่โหลดจริง:")
        print(f"- ชื่อโมเดล: {getattr(llm, 'model_name', 'ไม่สามารถระบุได้')}")
        print(f"- ชนิด: {type(llm).__name__}")
        
    except Exception as e:
        print(f"\nเกิดข้อผิดพลาดในการตรวจสอบโมเดล: {str(e)}")
    
    # ตรวจสอบ ChromaDB collections
    try:
        from langchain_chroma import Chroma
        
        print(f"\nข้อมูล ChromaDB:")
        
        if os.path.exists(CHROMA_DB_DIRECTORY):
            print(f"- พบไดเรกทอรี ChromaDB ที่: {CHROMA_DB_DIRECTORY}")
            
            # นับจำนวนไฟล์ในโฟลเดอร์
            file_count = len([f for f in os.listdir(CHROMA_DB_DIRECTORY) if os.path.isfile(os.path.join(CHROMA_DB_DIRECTORY, f))])
            print(f"- จำนวนไฟล์ใน ChromaDB: {file_count}")
            
            # ตรวจสอบข้อมูลเพิ่มเติมจาก collections (ถ้าเป็นไปได้)
            try:
                # ตัวอย่างการดึงชื่อ collections (อาจต้องปรับโค้ดตามโครงสร้างจริง)
                db = Chroma(persist_directory=CHROMA_DB_DIRECTORY, embedding_function=embeddings)
                print(f"- สร้าง Chroma instance สำเร็จ")
            except Exception as e:
                print(f"- ไม่สามารถเข้าถึงข้อมูล collection ได้: {str(e)}")
        else:
            print(f"- ไม่พบไดเรกทอรี ChromaDB ที่: {CHROMA_DB_DIRECTORY}")
            
    except Exception as e:
        print(f"- เกิดข้อผิดพลาดในการตรวจสอบ ChromaDB: {str(e)}")
        
    print("\n===== การตรวจสอบเสร็จสิ้น =====")

if __name__ == "__main__":
    check_models()