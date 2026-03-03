# backend/app/config.py
import os
from dotenv import load_dotenv

# โหลด environment variables จากไฟล์ .env
load_dotenv()

# Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# โมเดลจาก Groq ที่จะใช้ (เช่น llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it)
GROQ_MODEL_NAME = os.getenv("GROQ_MODEL_NAME", "llama-3.3-70b-versatile")

# ชื่อโมเดล Embedding จาก Hugging Face
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# พาธสำหรับเก็บข้อมูล ChromaDB (Legacy - for compatibility if needed)
CHROMA_DB_DIRECTORY = os.getenv("CHROMA_DB_DIRECTORY", "./chroma_db")

# Qdrant Configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")