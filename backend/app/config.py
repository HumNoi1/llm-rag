# backend/app/config.py
import os
from dotenv import load_dotenv

# โหลด environment variables จากไฟล์ .env
load_dotenv()

# Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# โมเดลจาก Groq ที่จะใช้ (เช่น llama2-70b-4096, mixtral-8x7b-32768, gemma-7b-it)
GROQ_MODEL_NAME = os.getenv("GROQ_MODEL_NAME", "llama2-70b-4096")

# ชื่อโมเดล Embedding จาก Hugging Face
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-m3")

# พาธสำหรับเก็บข้อมูล ChromaDB
CHROMA_DB_DIRECTORY = os.getenv("CHROMA_DB_DIRECTORY", "./chroma_db")