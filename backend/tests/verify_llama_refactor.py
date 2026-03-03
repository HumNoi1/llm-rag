import asyncio
import os
import sys

# เพิ่ม path เพื่อให้ import modules จาก app ได้
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.llama_index_service import LlamaIndexService
from dotenv import load_dotenv

async def verify_refactor():
    print("🚀 Starting LlamaIndex + Qdrant Verification...")
    load_dotenv(dotenv_path="backend/.env")
    
    # ตรวจสอบ Environment Variables
    required_keys = ["GROQ_API_KEY", "QDRANT_URL"]
    missing = [key for key in required_keys if not os.getenv(key)]
    if missing:
        print(f"❌ Missing Environment Variables: {', '.join(missing)}")
        return

    service = LlamaIndexService()
    
    # ข้อมูลทดสอบ
    subject_id = "test_101"
    question_id = "q_001"
    question = "Software Engineering คืออะไร?"
    
    # จำลองเนื้อหา PDF
    mock_answer_key = """
    วิศวกรรมซอฟต์แวร์ (Software Engineering) คือ ระเบียบวิธีการหรือกระบวนการที่นำหลักการทางวิศวกรรมมาใช้
    ในการพัฒนาซอฟต์แวร์อย่างเป็นระบบ ตั้งแต่การวิเคราะห์ความต้องการ การออกแบบ การสร้าง การทดสอบ 
    และการบำรุงรักษา เพื่อให้ได้ซอฟต์แวร์ที่มีคุณภาพสูง อยู่ในงบประมาณ และเสร็จตามกำหนดเวลา
    """
    
    print(f"📝 Step 1: Indexing Answer Key for Subject: {subject_id}...")
    
    try:
        from llama_index.core import Document as LlamaDocument, VectorStoreIndex, StorageContext
        
        doc = LlamaDocument(
            text=mock_answer_key,
            metadata={"subject_id": subject_id, "question_id": question_id}
        )
        
        collection_name = f"subject_{subject_id}_q_{question_id}"
        vector_store = service._get_vector_store(collection_name)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        VectorStoreIndex.from_documents([doc], storage_context=storage_context)
        print("✅ Indexing Successful!")
        
        # ขั้นตอนที่ 2: ทดสอบการประเมิน
        student_answer = "วิศวกรรมซอฟต์แวร์คือการนำหลักวิศวกรรมมาใช้ทำโปรแกรมให้มีคุณภาพและทันเวลา"
        print(f"🤖 Step 2: Evaluating Student Answer: '{student_answer}'")
        
        result = await service.evaluate_answer(
            question=question,
            student_answer=student_answer,
            subject_id=subject_id,
            question_id=question_id
        )
        
        print("\n--- Evaluation Result ---")
        print(f"Score: {result['score']}/40")
        print(f"Details:\n{result['evaluation']}")
        print("-------------------------")
        print("✅ Refactor Verification Complete!")

    except Exception as e:
        print(f"❌ Verification Failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_refactor())