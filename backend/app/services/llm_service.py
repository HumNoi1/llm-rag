# backend/app/services/llm_service.py
from langchain import hub
from langchain.prompts import PromptTemplate
from langgraph.graph import START, StateGraph
from typing_extensions import TypedDict, List
from langchain_core.documents import Document
from .model_service import ModelService

class EvaluationState(TypedDict):
    question: str
    student_answer: str
    subject_id: str
    question_id: str
    context: List[Document]
    evaluation: str
    score: float

class LLMEvaluationService:
    def __init__(self, rag_service):
        self.rag_service = rag_service
        # ดึง LLM จาก ModelService
        model_service = ModelService()
        self.llm = model_service.get_llm()
        
        # สร้าง prompt เอง แทนการใช้จาก hub เนื่องจากเราต้องการปรับให้เหมาะกับภาษาไทย
        self.prompt_template = """
        คุณเป็นผู้ช่วยอาจารย์ในการตรวจข้อสอบอัตนัย โปรดประเมินคำตอบของนักศึกษาโดยเปรียบเทียบกับเฉลยที่ให้มา
        
        ## คำถาม:
        {question}
        
        ## คำตอบของนักศึกษา:
        {student_answer}
        
        ## เนื้อหาจากเฉลย:
        {answer_key}
        
        โปรดประเมินคำตอบโดยให้คะแนนระหว่าง 0 ถึง 10 พร้อมคำอธิบายโดยละเอียด
        เริ่มต้นด้วยบรรทัดที่มี "คะแนน: X/10" และตามด้วยการอธิบายที่มีโครงสร้างดังนี้:
        
        1. จุดเด่นของคำตอบ
        2. จุดที่ขาดหรือไม่ถูกต้อง
        3. ข้อเสนอแนะในการปรับปรุง
        """
        
        self.prompt = PromptTemplate(
            template=self.prompt_template,
            input_variables=["question", "student_answer", "answer_key"]
        )
        
    def create_evaluation_graph(self):
        """สร้าง graph สำหรับการประเมินคำตอบ"""
        
        def retrieve(state: EvaluationState):
            """ค้นหาข้อมูลที่เกี่ยวข้องจากเฉลย"""
            query = f"คำถาม: {state['question']}\nคำตอบนักศึกษา: {state['student_answer']}"
            retrieved_docs = self.rag_service.retrieve_relevant_context(
                query=query,
                subject_id=state['subject_id'],
                question_id=state['question_id']
            )
            return {"context": retrieved_docs}
        
        def evaluate(state: EvaluationState):
            """ประเมินคำตอบนักเรียนเทียบกับเฉลย"""
            docs_content = "\n\n".join(doc.page_content for doc in state["context"])
            
            # ใช้ prompt ที่สร้างเอง
            prompt_value = self.prompt.format(
                question=state["question"],
                student_answer=state["student_answer"],
                answer_key=docs_content
            )
            
            # ส่งคำถามไปยัง Groq LLM
            response = self.llm.invoke(prompt_value)
            
            # แยกคะแนนและการประเมิน
            result = response.content
            
            # พยายามแยกคะแนนออกมา - สมมติว่าเริ่มต้นด้วย "คะแนน: X/10"
            try:
                score_line = result.split("\n")[0]
                if "คะแนน:" in score_line:
                    score_text = score_line.replace("คะแนน:", "").strip().split("/")[0]
                    score = float(score_text)
                else:
                    # ถ้าไม่พบรูปแบบที่คาดหวัง ให้กำหนดค่าเริ่มต้น
                    score = 5.0
            except:
                # ถ้ามีข้อผิดพลาด ให้กำหนดค่าเริ่มต้น
                score = 5.0
            
            return {
                "evaluation": result,
                "score": score
            }
        
        # สร้าง graph การประมวลผล
        graph_builder = StateGraph(EvaluationState).add_sequence([retrieve, evaluate])
        graph_builder.add_edge(START, "retrieve")
        return graph_builder.compile()
    
    def evaluate_answer(self, question, student_answer, subject_id, question_id):
        """ประเมินคำตอบของนักเรียน"""
        graph = self.create_evaluation_graph()
        result = graph.invoke({
            "question": question,
            "student_answer": student_answer,
            "subject_id": subject_id,
            "question_id": question_id
        })
        return result