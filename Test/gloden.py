import pandas as pd
from sklearn.metrics import mean_absolute_error, cohen_kappa_score
from typing import Dict

# =========================================================================
# 1. ข้อมูลทดสอบ (GOLDEN DATASET SIMULATION)
#    *สำคัญ: retrieval_relevance_rating และ reasoning_quality_rating ต้องเป็น Ground Truth
#    จากการประเมินของมนุษย์ หรือ LLM-as-a-Judge
# =========================================================================

# retrieval_relevance_rating (Miti 2)
# 0: ไม่เกี่ยวข้องเลย
# 1: เกี่ยวข้องบางส่วน (เช่น ข้อมูลไม่ครบ หรือผิดบริบทเล็กน้อย)
# 2: เกี่ยวข้องสมบูรณ์ (RAG ดึงเฉลยที่ถูกต้องมาครบ)

# reasoning_quality_rating (Miti 3)
# 1: เหตุผลแย่/ผิดพลาด
# 5: เหตุผลดีเยี่ยม สมเหตุสมผล สอดคล้องกับ Prompt

data = [
    {
        "id": 1,
        "question": "อธิบายวงจรชีวิตของกบ",
        "student_answer": "กบเริ่มจากเป็นไข่, ลูกอ๊อด, กบวัยอ่อน, แล้วเป็นกบโตเต็มวัย",
        "ground_truth_score": 5,
        "llm_score": 5,
        "retrieved_context": "เฉลย: วงจรชีวิตกบ: ไข่ -> ลูกอ๊อด -> กบวัยอ่อน -> กบโตเต็มวัย",
        "retrieval_relevance_rating": 2, # Context สมบูรณ์
        "reasoning_quality_rating": 5,   # เหตุผลดีเยี่ยม
    },
    {
        "id": 2,
        "question": "อธิบายวงจรชีวิตของกบ",
        "student_answer": "กบเริ่มจากไข่และกลายเป็นกบ",
        "ground_truth_score": 2,
        "llm_score": 3,
        "retrieved_context": "ข้อมูลที่ไม่เกี่ยวข้อง: กบกินแมลงและหนอนเป็นอาหาร", # RAG ดึงผิด
        "retrieval_relevance_rating": 0, # Context ไม่เกี่ยวข้อง
        "reasoning_quality_rating": 1,   # LLM ให้คะแนนผิดเพราะ RAG ผิด
    },
    {
        "id": 3,
        "question": "อธิบายการสังเคราะห์ด้วยแสง",
        "student_answer": "คือกระบวนการที่พืชสร้างอาหารโดยใช้แสง",
        "ground_truth_score": 3,
        "llm_score": 3,
        "retrieved_context": "เฉลย: พืชสร้างอาหารจากน้ำ, คาร์บอนไดออกไซด์", # Context มาไม่ครบ (ขาดคลอโรฟิลล์)
        "retrieval_relevance_rating": 1, # Context เกี่ยวข้องบางส่วน
        "reasoning_quality_rating": 4,   # เหตุผลค่อนข้างดี แต่ยังขาดส่วนที่หายไป
    },
]

# สร้าง DataFrame
df = pd.DataFrame(data)

# =========================================================================
# 2. ฟังก์ชันวัดผล End-to-End (มิติที่ 1: Grading Accuracy)
#    (ไม่เปลี่ยนแปลง - วัดความถูกต้องของคะแนนสุดท้าย)
# =========================================================================

def evaluate_end_to_end(df: pd.DataFrame) -> Dict[str, float]:
    """วัดผลความถูกต้องของคะแนนที่ LLM ให้ เทียบกับคะแนน Ground Truth (จากอาจารย์)"""
    y_true = df['ground_truth_score']
    y_pred = df['llm_score']
    
    exact_match = (y_true == y_pred).sum() / len(df)
    mae = mean_absolute_error(y_true, y_pred)
    kappa = cohen_kappa_score(y_true, y_pred, weights='linear')
    
    print("\n--- 1. ผลการวัดผล End-to-End (ความถูกต้องของคะแนน) ---")
    print(f"-> Exact Match Accuracy (คะแนนตรงเป๊ะ): {exact_match:.2%}")
    print(f"-> MAE (ความคลาดเคลื่อนเฉลี่ย): {mae:.2f} (ยิ่งต่ำยิ่งดี)")
    print(f"-> Cohen's Kappa (ความสอดคล้อง): {kappa:.2f}")

    return {"Exact Match Accuracy": exact_match, "MAE": mae, "Cohen's Kappa": kappa}

# =========================================================================
# 3. ฟังก์ชันวัดผล RAG Quality (มิติที่ 2: Retrieval Relevance)
#    (ใช้ Relevance Rating แทน Keyword Check)
# =========================================================================

def evaluate_retrieval_quality(df: pd.DataFrame) -> Dict[str, float]:
    """
    วัดผลคุณภาพของ Context ที่ RAG ดึงมา โดยใช้ Human/LLM-Evaluator Rating
    """
    # อัตราที่ RAG ดึง Context ที่เกี่ยวข้องมาสมบูรณ์ (Rating = 2)
    full_relevance_rate = (df['retrieval_relevance_rating'] == 2).mean()
    
    # คะแนนเฉลี่ยความเกี่ยวข้อง (Max 2)
    avg_relevance_score = df['retrieval_relevance_rating'].mean()
    
    print("\n--- 2. ผลการวัดผล RAG Quality (Retrieval Relevance) ---")
    print(f"-> Full Relevance Rate (RAG ดึง Context มาสมบูรณ์): {full_relevance_rate:.2%}")
    print(f"-> Average Relevance Score (คะแนนเฉลี่ยความเกี่ยวข้อง): {avg_relevance_score:.2f} (Max 2.00)")
    
    return {"Full Relevance Rate": full_relevance_rate, "Avg Relevance Score": avg_relevance_score}


# =========================================================================
# 4. ฟังก์ชันวัดผล LLM Reasoning Quality (มิติที่ 3: Reasoning Quality)
#    (ใช้ Reasoning Quality Rating)
# =========================================================================

def evaluate_reasoning_quality(df: pd.DataFrame) -> Dict[str, float]:
    """
    วัดผลคุณภาพการให้เหตุผลและการเปรียบเทียบที่ LLM สร้าง โดยใช้ Human/LLM-Evaluator Rating
    """
    
    # คะแนนเฉลี่ยคุณภาพการให้เหตุผล (Max 5)
    avg_reasoning_score = df['reasoning_quality_rating'].mean()
    
    # อัตราที่ LLM ให้คะแนนถูกต้องและเหตุผลคุณภาพสูง (Reasoning Rating >= 4)
    # นี่คือตัวชี้วัด Faithfulness และ Coherence ในตัว
    high_quality_reasoning_match = df.apply(
        lambda row: 1 if row['llm_score'] == row['ground_truth_score'] and row['reasoning_quality_rating'] >= 4 else 0,
        axis=1
    ).mean()
    
    print("\n--- 3. ผลการวัดผล LLM Reasoning Quality ---")
    print(f"-> Average Reasoning Quality Score: {avg_reasoning_score:.2f} (Max 5.00)")
    print(f"-> High-Quality Grading Match Rate: {high_quality_reasoning_match:.2%} (LLM Score ตรง และเหตุผลดี)")
    
    return {"Avg Reasoning Score": avg_reasoning_score, "High Quality Match Rate": high_quality_reasoning_match}

# =========================================================================
# 5. การรันชุดการวัดผลทั้งหมด
# =========================================================================

def run_evaluation_suite(df: pd.DataFrame):
    """รันชุดการวัดผลทั้งหมดตามหลักการที่แนะนำ"""
    
    end_to_end_results = evaluate_end_to_end(df)
    retrieval_results = evaluate_retrieval_quality(df)
    reasoning_results = evaluate_reasoning_quality(df)

    print("\n=======================================================")
    print("      สรุปผลการวัดผลโปรเจค LLM + RAG Grading Suite      ")
    print("=======================================================")
    
    print("มิติที่ 1: ความถูกต้องของการให้คะแนน (End-to-End)")
    print(f"  - ความแม่นยำที่คะแนนตรงเป๊ะ (Exact Match): {end_to_end_results['Exact Match Accuracy']:.2%}")
    print(f"  - ความคลาดเคลื่อนเฉลี่ย (MAE): {end_to_end_results['MAE']:.2f} คะแนน")
    
    print("\nมิติที่ 2: คุณภาพการค้นคืนข้อมูล (RAG Quality)")
    print(f"  - อัตราความสำเร็จในการค้นคืน Context สมบูรณ์: {retrieval_results['Full Relevance Rate']:.2%}")
    print(f"  - คะแนนเฉลี่ยความเกี่ยวข้อง: {retrieval_results['Avg Relevance Score']:.2f} / 2.00")

    print("\nมิติที่ 3: คุณภาพการให้เหตุผล (LLM Reasoning)")
    print(f"  - คะแนนเฉลี่ยคุณภาพเหตุผล: {reasoning_results['Avg Reasoning Score']:.2f} / 5.00")
    print(f"  - อัตราการให้คะแนนถูกต้องพร้อมเหตุผลคุณภาพสูง: {reasoning_results['High Quality Match Rate']:.2%}")

# รันโค้ด
if __name__ == "__main__":
    run_evaluation_suite(df)