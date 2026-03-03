from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict

class EvaluationRequest(BaseModel):
    question: str
    student_answer: str
    subject_id: str
    question_id: str

class ScoreDetail(BaseModel):
    criteria: str = Field(..., description="ชื่อเกณฑ์การให้คะแนน")
    score: float = Field(..., description="คะแนนที่ได้ (0-2)")
    max_score: float = 2.0
    reason: str = Field(..., description="เหตุผลการให้คะแนน")

class EvaluationResponse(BaseModel):
    evaluation_text: str = Field(..., description="สรุปผลการประเมินแบบข้อความ")
    total_score: float = Field(..., description="คะแนนเต็ม 40 คะแนน")
    normalized_score: float = Field(..., description="คะแนนเต็ม 10 คะแนน")
    details: List[ScoreDetail] = Field(default_factory=list, description="รายละเอียดคะแนนรายหมวด")
    correct_points: List[str] = Field(default_factory=list, description="จุดที่นักศึกษาทำได้ถูกต้อง")
    missing_points: List[str] = Field(default_factory=list, description="จุดที่นักศึกษาทำหายไปหรือผิดพลาด")
    subject_id: str
    question_id: str

class StorageEvaluationRequest(BaseModel):
    subject_id: str
    question_id: str
    answer_key_url: str
    student_answer_url: str
