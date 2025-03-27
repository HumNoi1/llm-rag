# backend/app/routers/evaluation.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from ..services.llm_service import LLMEvaluationService
from ..services.rag_service import AnswerEvaluationService
from ..models.schemas import EvaluationRequest, EvaluationResponse

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])

@router.post("/upload-answer-key")
async def upload_answer_key(
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    question_id: str = Form(...),
    rag_service: AnswerEvaluationService = Depends()
):
    """อัปโหลดไฟล์เฉลยของอาจารย์ (รองรับเฉพาะไฟล์ PDF)"""
    # ตรวจสอบนามสกุลของไฟล์
    file_name = file.filename
    
    # รองรับเฉพาะไฟล์ PDF เท่านั้น
    if not file_name.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="รองรับเฉพาะไฟล์ PDF เท่านั้น"
        )
    
    content = await file.read()
    
    try:
        # ส่งทั้งเนื้อหาไฟล์และชื่อไฟล์ไปยัง index_answer_key
        chunks = rag_service.index_answer_key(
            answer_key_content=content,
            subject_id=subject_id,
            question_id=question_id,
            file_name=file_name
        )
         
        return JSONResponse({
            "message": f"PDF answer key indexed successfully with {chunks} chunks",
            "file_name": file_name,
            "subject_id": subject_id,
            "question_id": question_id,
            "file_type": "PDF",
            "chunks": chunks
        })
    except Exception as e:
        # จัดการข้อผิดพลาด
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(
    request: EvaluationRequest,
    llm_service: LLMEvaluationService = Depends()
):
    """ประเมินคำตอบของนักเรียน"""
    result = llm_service.evaluate_answer(
        question=request.question,
        student_answer=request.student_answer,
        subject_id=request.subject_id,
        question_id=request.question_id
    )
    
    return EvaluationResponse(
        evaluation=result["evaluation"],
        score=result["score"],
        subject_id=request.subject_id,
        question_id=request.question_id
    )