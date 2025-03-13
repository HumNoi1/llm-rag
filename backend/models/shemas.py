# backend/app/models/schemas.py
from pydantic import BaseModel

class EvaluationRequest(BaseModel):
    question: str
    student_answer: str
    subject_id: str
    question_id: str

class EvaluationResponse(BaseModel):
    evaluation: str
    score: float
    subject_id: str
    question_id: str