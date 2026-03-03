from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from ..services.llama_index_service import LlamaIndexService
from ..models.schemas import EvaluationRequest, EvaluationResponse, StorageEvaluationRequest
from ..services.supabase_service import SupabaseService

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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
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
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate-from-storage", response_model=EvaluationResponse)
async def evaluate_from_storage(
    request: StorageEvaluationRequest,
    llama_service: LlamaIndexService = Depends(),
    supabase_service: SupabaseService = Depends()
):
    try:
        result = await llama_service.evaluate_answer_from_storage(
            subject_id=request.subject_id,
            question_id=request.question_id,
            answer_key_url=request.answer_key_url,
            student_answer_url=request.student_answer_url,
            supabase_service=supabase_service
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
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
