import pandas as pd
from sklearn.metrics import cohen_kappa_score, mean_absolute_error
from typing import Dict

# =========================================================================
# 1. ข้อมูลทดสอบ (GOLDEN DATASET SIMULATION)
#    ใช้แค่ Ground Truth Score และ LLM Score
# =========================================================================

data = [
    {
        "id": 1,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 2,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 3,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 4,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 5,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 6,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 7,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 8,
        "ground_truth_score": 9,
        "llm_score": 8
    },
    {
        "id": 9,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 10,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 11,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 12,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 13,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 14,
        "ground_truth_score": 5,
        "llm_score": 2
    },
    {
        "id": 15,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 16,
        "ground_truth_score": 9,
        "llm_score": 6
    },
    {
        "id": 17,
        "ground_truth_score": 7,
        "llm_score": 6
    },
    {
        "id": 18,
        "ground_truth_score": 5,
        "llm_score": 2
    },
    {
        "id": 19,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 20,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 21,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 22,
        "ground_truth_score": 7,
        "llm_score": 6
    },
    {
        "id": 23,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 24,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 25,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 26,
        "ground_truth_score": 7,
        "llm_score": 6
    },
    {
        "id": 27,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 28,
        "ground_truth_score": 9,
        "llm_score": 8
    },
    {
        "id": 29,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 30,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 31,
        "ground_truth_score": 7,
        "llm_score": 8
    },
    {
        "id": 32,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 33,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 34,
        "ground_truth_score": 7,
        "llm_score": 8
    },
    {
        "id": 35,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 36,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 37,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 38,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 39,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 40,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 41,
        "ground_truth_score": 7,
        "llm_score": 8
    },
    {
        "id": 42,
        "ground_truth_score": 9,
        "llm_score": 6
    },
    {
        "id": 43,
        "ground_truth_score": 5,
        "llm_score": 6
    },
    {
        "id": 44,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 45,
        "ground_truth_score": 7,
        "llm_score": 4
    },
    {
        "id": 46,
        "ground_truth_score": 9,
        "llm_score": 8
    },
    {
        "id": 47,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 48,
        "ground_truth_score": 5,
        "llm_score": 4
    },
    {
        "id": 49,
        "ground_truth_score": 2,
        "llm_score": 2
    },
    {
        "id": 50,
        "ground_truth_score": 5,
        "llm_score": 4
    }
]

df = pd.DataFrame(data)

# =========================================================================
# 2. ฟังก์ชันวัดผล End-to-End Score Agreement
# =========================================================================

def calculate_weighted_kappa(y_true: pd.Series, y_pred: pd.Series, weights: str = 'linear') -> float:
    """
    คำนวณ Weighted Cohen's Kappa สำหรับความสอดคล้องของการให้คะแนน
    """
    # ใช้ 'linear' weights สำหรับคะแนนที่เป็นลำดับ
    kappa_score = cohen_kappa_score(y_true, y_pred, weights=weights)
    return kappa_score

def evaluate_simplified_score(df: pd.DataFrame) -> Dict[str, float]:
    """
    วัดผลความสอดคล้องและความถูกต้องของคะแนนที่ LLM ให้ (Simplified)
    """
    y_true = df['ground_truth_score']
    y_pred = df['llm_score']
    
    # 1. Weighted Kappa (Linear) - ความสอดคล้องของการให้คะแนน
    score_kappa = calculate_weighted_kappa(y_true, y_pred, weights='linear')
    
    # 2. Mean Absolute Error (MAE) - ความคลาดเคลื่อนเฉลี่ย
    mae = mean_absolute_error(y_true, y_pred)
    
    # 3. Exact Match Accuracy - ความแม่นยำของคะแนนที่ตรงกันเป๊ะ
    exact_match = (y_true == y_pred).mean()

    print("\n=======================================================")
    print("       ผลการวัดผล End-to-End (Score Only)      ")
    print("=======================================================")
    print(f"-> Weighted Kappa (ความสอดคล้องของการให้คะแนน): {score_kappa:.4f}")
    print(f"   (ค่าที่สูงกว่า 0.61 ถือว่าดีมาก)")
    print(f"-> MAE (Mean Absolute Error - ความคลาดเคลื่อนเฉลี่ย): {mae:.2f} คะแนน")
    print(f"   (ยิ่งต่ำยิ่งดี, ค่า 0.00 คือสมบูรณ์แบบ)")
    print(f"-> Exact Match Accuracy (คะแนนตรงเป๊ะ): {exact_match:.2%}")

    return {"Kappa": score_kappa, "MAE": mae, "Accuracy": exact_match}

# รันโค้ด
if __name__ == "__main__":
    evaluate_simplified_score(df)