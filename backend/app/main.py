# backend/app/main.py
from fastapi import FastAPI, Depends
from .services.rag_service import AnswerEvaluationService
from .services.llm_service import LLMEvaluationService
from .routers import evaluation

app = FastAPI(title="ระบบผู้ช่วยตรวจข้อสอบอัตนัย", version="1.0.0")

# Dependency providers
def get_rag_service():
    return AnswerEvaluationService()

def get_llm_service(rag_service: AnswerEvaluationService = Depends(get_rag_service)):
    return LLMEvaluationService(rag_service)

# ลงทะเบียน dependencies กับ FastAPI
app.dependency_overrides[AnswerEvaluationService] = get_rag_service
app.dependency_overrides[LLMEvaluationService] = get_llm_service

# เพิ่ม routers
app.include_router(evaluation.router)

@app.get("/")
async def root():
    return {"message": "ยินดีต้อนรับสู่ API ผู้ช่วยตรวจข้อสอบอัตนัย"}