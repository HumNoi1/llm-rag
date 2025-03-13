# backend/tests/test_chromadb.py
import os
import shutil
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

# โหลดตัวแปรสภาพแวดล้อมจาก .env
load_dotenv()

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
TEST_DB_PATH = "./test_chroma_db"

def test_chromadb():
    """ทดสอบการทำงานของ ChromaDB"""
    
    # ลบฐานข้อมูลทดสอบเก่าถ้ามี
    if os.path.exists(TEST_DB_PATH):
        shutil.rmtree(TEST_DB_PATH)
    
    # สร้างโฟลเดอร์สำหรับฐานข้อมูลทดสอบ
    os.makedirs(TEST_DB_PATH, exist_ok=True)
    
    # สร้าง embeddings model
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL_NAME,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )
    
    # สร้างเอกสารทดสอบ
    documents = [
        Document(page_content="การออกแบบซอฟต์แวร์ที่ดีควรคำนึงถึงการขยายตัวในอนาคต", metadata={"subject_id": "CS101", "question_id": "Q1"}),
        Document(page_content="การทดสอบซอฟต์แวร์แบ่งเป็นหลายระดับ ได้แก่ Unit Testing, Integration Testing, และ System Testing", metadata={"subject_id": "CS101", "question_id": "Q1"}),
        Document(page_content="Agile เป็นวิธีการพัฒนาซอฟต์แวร์ที่เน้นการทำงานเป็นทีมและการปรับตัวต่อการเปลี่ยนแปลง", metadata={"subject_id": "CS101", "question_id": "Q1"})
    ]
    
    # สร้าง Chroma collection
    db = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=TEST_DB_PATH,
        collection_name="test_collection"
    )
    
    print("Created and persisted Chroma DB successfully")
    
    # โหลด Chroma DB จากดิสก์
    loaded_db = Chroma(
        persist_directory=TEST_DB_PATH,
        embedding_function=embeddings,
        collection_name="test_collection"
    )
    
    # ทดสอบค้นหา
    query = "การทดสอบซอฟต์แวร์คืออะไร"
    results = loaded_db.similarity_search(query, k=2)
    
    print("\nSearch Results:")
    for i, doc in enumerate(results):
        print(f"Result {i+1}:")
        print(f"Content: {doc.page_content}")
        print(f"Metadata: {doc.metadata}")
        print()
    
    # ลบฐานข้อมูลทดสอบ
    if os.path.exists(TEST_DB_PATH):
        shutil.rmtree(TEST_DB_PATH)
    
if __name__ == "__main__":
    test_chromadb()