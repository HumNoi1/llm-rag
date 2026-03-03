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

# Singleton instances — สร้างครั้งเดียวเมื่อ app เริ่มต้น เพื่อป้องกัน embedding model reload ซ้ำทุก request
_llama_index_service: LlamaIndexService | None = None
_supabase_service: SupabaseService | None = None


def setup_dependencies() -> None:
    """กำหนด dependencies สำหรับ FastAPI"""
    global _llama_index_service, _supabase_service
    _llama_index_service = LlamaIndexService()
    _supabase_service = SupabaseService()

    # Dependency providers
    def get_llama_index_service() -> LlamaIndexService:
        """ส่งคืน LlamaIndex service instance (singleton)"""
        return _llama_index_service

    def get_supabase_service() -> SupabaseService:
        """ส่งคืน Supabase service instance (singleton)"""
        return _supabase_service

    # ลงทะเบียน dependencies กับ FastAPI
    app.dependency_overrides[LlamaIndexService] = get_llama_index_service
    app.dependency_overrides[SupabaseService] = get_supabase_service


def setup_routers() -> None:
    """กำหนด routers สำหรับ FastAPI"""
    app.include_router(evaluation.router)


def setup_routes() -> None:
    """กำหนด routes พื้นฐานสำหรับ FastAPI"""

    @app.get("/")
    async def root() -> dict:
        """Route หลักของ API"""
        return {"message": "ยินดีต้อนรับสู่ API ผู้ช่วยตรวจข้อสอบอัตนัย (Refactored with LlamaIndex)"}

# เริ่มต้นตั้งค่า app
setup_dependencies()
setup_routers()
setup_routes()