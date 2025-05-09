# backend/app/routers/evaluation.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from ..services.llm_service import LLMEvaluationService
from ..services.rag_service import AnswerEvaluationService
from ..models.schemas import EvaluationRequest, EvaluationResponse
from ..services.supabase_service import SupabaseService
from ..models.schemas import StorageEvaluationRequest
import tempfile
import os

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

@router.post("/evaluate-from-storage", response_model=EvaluationResponse)
async def evaluate_from_storage(
    request: StorageEvaluationRequest,
    llm_service: LLMEvaluationService = Depends(),
    rag_service: AnswerEvaluationService = Depends(),
    supabase_service: SupabaseService = Depends()
):
    """
    ประเมินคำตอบจากไฟล์ที่เก็บใน Supabase Storage
    
    Args:
        request: ข้อมูลการประเมินจาก Storage
        llm_service: LLMEvaluationService (dependency injection)
        rag_service: AnswerEvaluationService (dependency injection)
        supabase_service: SupabaseService (dependency injection)
    
    Returns:
        EvaluationResponse ผลการประเมินคำตอบ
    """
    try:
        # ดาวน์โหลดไฟล์เฉลย
        answer_key_content, answer_key_filename = await supabase_service.download_file_from_url(request.answer_key_url)
        
        # ดาวน์โหลดไฟล์คำตอบนักเรียน
        student_answer_content, student_answer_filename = await supabase_service.download_file_from_url(request.student_answer_url)
        
        # เพิ่มเฉลยเข้า ChromaDB
        chunks = await rag_service.index_answer_key_from_url(
            answer_key_content=answer_key_content,
            file_name=answer_key_filename,
            subject_id=request.subject_id,
            question_id=request.question_id
        )
        
        print(f"เพิ่มเฉลยเข้า ChromaDB สำเร็จ: {chunks} ชิ้นส่วน")
        
        # สกัดข้อความจากไฟล์คำตอบนักเรียน
        temp_path = None
        try:
            # สร้างไฟล์ชั่วคราว
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(student_answer_content)
                temp_path = temp_file.name
            
            # สกัดข้อความจาก PDF
            student_answer = rag_service.extract_text_from_pdf(temp_path)
            
            # สร้างคำถามจาก context
            context_docs = rag_service.retrieve_relevant_context(
                query="ข้อสอบอัตนัย",
                subject_id=request.subject_id,
                question_id=request.question_id
            )
            
            context_text = "\n\n".join(doc.page_content for doc in context_docs)
            question = f"ให้ตอบคำถามต่อไปนี้ตามเนื้อหาที่เรียน: {context_text[:300]}..."
            
            # ประเมินคำตอบ
            result = llm_service.evaluate_answer(
                question=question,
                student_answer=student_answer,
                subject_id=request.subject_id,
                question_id=request.question_id
            )
            
            return EvaluationResponse(
                evaluation=result["evaluation"],
                score=result["score"],
                subject_id=request.subject_id,
                question_id=request.question_id
            )
            
        finally:
            # ลบไฟล์ชั่วคราวหลังใช้งาน
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
                
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการประเมินคำตอบ: {str(e)}"
        )