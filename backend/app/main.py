# backend/app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .services.llama_index_service import LlamaIndexService
from .services.supabase_service import SupabaseService
from .routers import evaluation

# สร้าง FastAPI app
app = FastAPI(
    title="ระบบผู้ช่วยตรวจข้อสอบอัตนัย (LlamaIndex Refactored)",
    version="2.0.0",
    description="API สำหรับระบบผู้ช่วยตรวจข้อสอบอัตนัยด้วย LlamaIndex และ Qdrant"
)

origins = [
    "http://localhost:3000",
    "https://localhost",
    "https://localhost:8080",
    "https://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def setup_dependencies():
    """กำหนด dependencies สำหรับ FastAPI"""
    
    # Dependency providers
    def get_llama_index_service():
        """สร้าง LlamaIndex service instance"""
        return LlamaIndexService()

    def get_supabase_service():
        """สร้าง Supabase service instance"""
        return SupabaseService()
    
    # ลงทะเบียน dependencies กับ FastAPI
    app.dependency_overrides[LlamaIndexService] = get_llama_index_service
    app.dependency_overrides[SupabaseService] = get_supabase_service

def setup_routers():
    """กำหนด routers สำหรับ FastAPI"""
    app.include_router(evaluation.router)

def setup_routes():
    """กำหนด routes พื้นฐานสำหรับ FastAPI"""
    
    @app.get("/")
    async def root():
        """Route หลักของ API"""
        return {"message": "ยินดีต้อนรับสู่ API ผู้ช่วยตรวจข้อสอบอัตนัย (Refactored with LlamaIndex)"}

# เริ่มต้นตั้งค่า app
setup_dependencies()
setup_routers()
setup_routes()