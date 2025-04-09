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
    """
    อัปโหลดไฟล์เฉลยของอาจารย์ (รองรับเฉพาะไฟล์ PDF)
    
    Args:
        file: ไฟล์ PDF ที่อัปโหลด
        subject_id: รหัสวิชา
        question_id: รหัสคำถาม
        rag_service: AnswerEvaluationService (dependency injection)
    
    Returns:
        JSONResponse พร้อมข้อมูลผลการอัปโหลด
    
    Raises:
        HTTPException: เมื่อเกิดข้อผิดพลาดในการอัปโหลดหรือประมวลผลไฟล์
    """
    # ตรวจสอบนามสกุลของไฟล์
    _validate_pdf_file(file.filename)
    
    try:
        # อ่านเนื้อหาไฟล์
        content = await file.read()
        
        # ส่งเนื้อหาไฟล์ไปยัง index_answer_key
        chunks = rag_service.index_answer_key(
            answer_key_content=content,
            subject_id=subject_id,
            question_id=question_id,
            file_name=file.filename
        )
         
        # สร้างและส่งคืนการตอบสนอง
        return _create_upload_success_response(file.filename, subject_id, question_id, chunks)
    
    except ValueError as e:
        # จัดการข้อผิดพลาดที่เกิดจากการตรวจสอบค่า
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        # จัดการข้อผิดพลาดอื่นๆ
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(
    request: EvaluationRequest,
    llm_service: LLMEvaluationService = Depends()
):
    """
    ประเมินคำตอบของนักเรียน
    
    Args:
        request: คำขอประเมินคำตอบ
        llm_service: LLMEvaluationService (dependency injection)
    
    Returns:
        EvaluationResponse ผลการประเมินคำตอบ
    """
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

def _validate_pdf_file(filename: str):
    """
    ตรวจสอบว่าไฟล์เป็น PDF หรือไม่
    
    Args:
        filename: ชื่อไฟล์ที่ต้องการตรวจสอบ
    
    Raises:
        HTTPException: ถ้าไฟล์ไม่ใช่ PDF
    """
    if not filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="รองรับเฉพาะไฟล์ PDF เท่านั้น"
        )

def _create_upload_success_response(filename: str, subject_id: str, question_id: str, chunks: int):
    """
    สร้างการตอบสนองสำหรับการอัปโหลดสำเร็จ
    
    Args:
        filename: ชื่อไฟล์ที่อัปโหลด
        subject_id: รหัสวิชา
        question_id: รหัสคำถาม
        chunks: จำนวนชิ้นส่วนที่แบ่งได้
    
    Returns:
        JSONResponse พร้อมข้อมูลผลการอัปโหลด
    """
    return JSONResponse({
        "message": f"PDF answer key indexed successfully with {chunks} chunks",
        "file_name": filename,
        "subject_id": subject_id,
        "question_id": question_id,
        "file_type": "PDF",
        "chunks": chunks
    })