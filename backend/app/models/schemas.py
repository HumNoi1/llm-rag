# backend/app/models/schemas.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class QuestionScore(BaseModel):
    question_number: int
    score: float
    max_score: float = 5.0
    feedback: Optional[str] = None

class EvaluationRequest(BaseModel):
    question: str
    student_answer: str
    subject_id: str
    question_id: str

class EvaluationResponse(BaseModel):
    evaluation: str
    scores: List[QuestionScore] = []
    total_score: float
    max_score: float
    subject_id: str
    question_id: str

class StorageEvaluationRequest(BaseModel):
    subject_id: str
    question_id: str
    answer_key_url: str
    student_answer_url: str
    answer_key_path: str
    student_answer_path: str