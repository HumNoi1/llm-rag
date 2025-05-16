# backend/app/models/schemas.py
from pydantic import BaseModel
from typing import List, Optional

class EvaluationRequest(BaseModel):
    question: str
    student_answer: str
    subject_id: str
    question_id: str

class QuestionScoreItem(BaseModel):
    question_number: int
    score: float
    max_score: float = 10.0
    feedback: str

class EvaluationResponse(BaseModel):
    evaluation: str  # ผลการประเมินทั้งหมด
    score: float  # คะแนนรวม
    subject_id: str
    question_id: str
    question_scores: List[QuestionScoreItem] = []  # คะแนนแยกตามข้อ
    total_score: float  # คะแนนรวม
    total_max_score: float  # คะแนนเต็ม

class StorageEvaluationRequest(BaseModel):
    subject_id: str
    question_id: str
    answer_key_url: str
    student_answer_url: str
    answer_key_path: str
    student_answer_path: str