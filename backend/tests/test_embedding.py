# backend/tests/test_embeddings.py
import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings

# โหลดตัวแปรสภาพแวดล้อมจาก .env
load_dotenv()

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

def test_embeddings():
    """ทดสอบการทำงานของ Hugging Face Embeddings"""
    
    # สร้าง instance ของ HuggingFaceEmbeddings
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL_NAME,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )
    
    # ทดสอบการแปลงข้อความเป็น embeddings
    text = "การเรียนรู้เชิงลึกเป็นส่วนหนึ่งของปัญญาประดิษฐ์"
    embedding = embeddings.embed_query(text)
    
    # พิมพ์ขนาดของ embedding
    print(f"Embedding dimension: {len(embedding)}")
    print(f"First 5 values: {embedding[:5]}")
    
    # ทดสอบการสร้าง embeddings หลายข้อความพร้อมกัน
    texts = [
        "วิชาวิศวกรรมซอฟต์แวร์",
        "แนวคิดการออกแบบซอฟต์แวร์",
        "การทดสอบซอฟต์แวร์อัตโนมัติ"
    ]
    
    embeddings_list = embeddings.embed_documents(texts)
    
    # ตรวจสอบว่าได้ embeddings จำนวนเท่ากับข้อความ
    assert len(embeddings_list) == len(texts), "จำนวน embeddings ไม่ตรงกับจำนวนข้อความ"
    
    print(f"Successfully created {len(embeddings_list)} embeddings")
    
if __name__ == "__main__":
    test_embeddings()