from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from ..services.llama_index_service import LlamaIndexService
from ..models.schemas import EvaluationRequest, EvaluationResponse, StorageEvaluationRequest
from ..services.supabase_service import SupabaseService
import tempfile
import os
import fitz

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])

@router.post("/upload-answer-key")
async def upload_answer_key(
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    question_id: str = Form(...),
    llama_service: LlamaIndexService = Depends()
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="รองรับเฉพาะไฟล์ PDF เท่านั้น")
    
    try:
        content = await file.read()
        await llama_service.index_pdf_content(
            file_content=content,
            file_name=file.filename,
            subject_id=subject_id,
            question_id=question_id,
            force_reindex=True
        )
         
        return JSONResponse({
            "message": "Answer key indexed successfully",
            "subject_id": subject_id,
            "question_id": question_id
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(
    request: EvaluationRequest,
    llama_service: LlamaIndexService = Depends()
):
    try:
        result = await llama_service.evaluate_answer(
            question=request.question,
            student_answer=request.student_answer,
            subject_id=request.subject_id,
            question_id=request.question_id
        )
        
        return EvaluationResponse(
            evaluation_text=result["evaluation_text"],
            total_score=result["total_score"],
            normalized_score=result["normalized_score"],
            details=result["details"],
            correct_points=result["correct_points"],
            missing_points=result["missing_points"],
            subject_id=request.subject_id,
            question_id=request.question_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate-from-storage", response_model=EvaluationResponse)
async def evaluate_from_storage(
    request: StorageEvaluationRequest,
    llama_service: LlamaIndexService = Depends(),
    supabase_service: SupabaseService = Depends()
):
    try:
        collection_name = f"subject_{request.subject_id}_q_{request.question_id}"
        
        if not llama_service._collection_exists(collection_name):
            answer_key_content, answer_key_filename = await supabase_service.download_file_from_url(request.answer_key_url)
            await llama_service.index_pdf_content(
                file_content=answer_key_content,
                file_name=answer_key_filename,
                subject_id=request.subject_id,
                question_id=request.question_id
            )
        
        student_answer_content, _ = await supabase_service.download_file_from_url(request.student_answer_url)
        student_text = ""
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(student_answer_content)
            temp_path = temp_file.name
        
        try:
            with fitz.open(temp_path) as doc:
                for page in doc:
                    student_text += page.get_text()
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

        result = await llama_service.evaluate_answer(
            question="จงตรวจคำตอบตามเนื้อหาในเฉลย",
            student_answer=student_text,
            subject_id=request.subject_id,
            question_id=request.question_id
        )
        
        return EvaluationResponse(
            evaluation_text=result["evaluation_text"],
            total_score=result["total_score"],
            normalized_score=result["normalized_score"],
            details=result["details"],
            correct_points=result["correct_points"],
            missing_points=result["missing_points"],
            subject_id=request.subject_id,
            question_id=request.question_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
