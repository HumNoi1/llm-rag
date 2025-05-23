# backend/app/models/schemas.py
from pydantic import BaseModel, Field

class EvaluationRequest(BaseModel):
    question: str
    student_answer: str
    subject_id: str
    question_id: str

class EvaluationResponse(BaseModel):
    evaluation: str
    score: float = Field(..., description="คะแนนเต็ม 40 คะแนน")
    subject_id: str
    question_id: str

class StorageEvaluationRequest(BaseModel):
    subject_id: str
    question_id: str
    answer_key_url: str
    student_answer_url: str
    answer_key_path: str
    student_answer_path: str