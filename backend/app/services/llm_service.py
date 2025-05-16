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
        """
        สร้าง service สำหรับการประเมินคำตอบด้วย LLM
        
        Args:
            rag_service: บริการ RAG สำหรับการค้นหาข้อมูลที่เกี่ยวข้อง
        """
        self.rag_service = rag_service
        
        # เตรียม LLM และ prompt
        self._setup_llm_and_prompt()
    
    def _setup_llm_and_prompt(self):
        """เตรียม LLM และ prompt สำหรับการประเมิน"""
        # ดึง LLM จาก ModelService
        model_service = ModelService()
        self.llm = model_service.get_llm()
        
        # สร้าง prompt สำหรับประเมินคำตอบภาษาไทย
        self.prompt_template = self._create_evaluation_prompt_template()
        self.prompt = PromptTemplate(
            template=self.prompt_template,
            input_variables=["question", "student_answer", "answer_key"]
        )
    
    def _create_evaluation_prompt_template(self):
        """
        สร้าง template สำหรับ prompt ที่ใช้ในการประเมิน
        
        Returns:
            template string สำหรับ prompt
        """
        return """
        คุณเป็นผู้ช่วยอาจารย์ในการตรวจข้อสอบอัตนัยของนักศึกษาในวิชาแนวคิดวิศวกรรมซอฟต์แวร์

        โปรดประเมินคำตอบของนักศึกษาโดยเปรียบเทียบกับเฉลยที่ระบบดึงมาจากฐานความรู้
        ห้ามใช้ความรู้ของคุณเองนอกเหนือจากเนื้อหาในเฉลย

        หากไม่มีข้อมูลเพียงพอในการประเมิน ให้ตอบว่า
        "ไม่สามารถประเมินได้เนื่องจากไม่มีข้อมูลเฉลยเพียงพอ"
        
        ประเมินโดยใช้เกณฑ์:

        1. **ความเข้าใจแนวคิดและนิยาม**
        - 2 = อธิบายแนวคิดและนิยามได้ถูกต้อง ครบถ้วน ชัดเจน และเชื่อมโยงแนวคิดได้อย่างเหมาะสม [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 1 = อธิบายถูกต้องในหลักการ แต่ไม่ครบหรือไม่เชื่อมโยง [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 0 = อธิบายไม่ถูกต้อง คลาดเคลื่อน หรือไม่ตอบคำถาม [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]

        2. **การวิเคราะห์และประยุกต์ใช้**
        - 2 = วิเคราะห์และประยุกต์ทฤษฎีได้อย่างถูกต้อง ลึกซึ้ง และสอดคล้องกับบริบท [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 1 = วิเคราะห์ถูกต้องในหลักการ แต่ยังไม่ลึกซึ้ง [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 0 = วิเคราะห์ผิดประเด็น หรือไม่สามารถวิเคราะห์ได้ [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]

        3. **ความครบถ้วนของเนื้อหา**
        - 2 = ครบทุกประเด็นสำคัญ + ยกตัวอย่างได้ชัดเจน [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 1 = ครอบคลุมส่วนใหญ่ แต่ยังขาดบางประเด็นหรือตัวอย่าง [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 0 = ขาดหลายประเด็น หรือไม่มีตัวอย่างเลย [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]

        4. **การเปรียบเทียบและให้เหตุผล**
        - 2 = เปรียบเทียบแนวคิดต่าง ๆ ชัดเจน มีเหตุผลสนับสนุนดี [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 1 = เปรียบเทียบบางส่วน หรือเหตุผลยังไม่สมบูรณ์ [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 0 = ไม่มีการเปรียบเทียบหรือเหตุผลไม่ถูกต้อง [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]

        5. **การสื่อสารและเรียบเรียง**
        - 2 = เรียบเรียงชัดเจน ใช้ภาษาถูกต้อง ใช้คำศัพท์เฉพาะได้เหมาะสม [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 1 = สื่อสารเข้าใจได้แต่บางจุดยังไม่ชัดเจน หรือใช้คำศัพท์ไม่ดีพอ [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]
        - 0 = เรียบเรียงไม่ดี สับสน ใช้คำผิดบ่อย [อธิบายเจาะลึกว่าทำไมได้คะแนนเท่านี้]

        **สัดส่วนคะแนนสำหรับข้อสอบวิเคราะห์:**
        - ความเข้าใจแนวคิด: 15%
        - การวิเคราะห์: 30%
        - ความครบถ้วน: 15%
        - การเปรียบเทียบ: 25%
        - การเรียบเรียง: 15%

        โปรดแสดงผลลัพธ์ดังนี้:
        - คะแนนดิบแต่ละหมวด (0-2)
        - ค่าคะแนนที่ถ่วงน้ำหนักแล้วแต่ละหมวด
        - คะแนนรวมต่อข้อ (เต็ม 10 คะแนน)
        - เหตุผลประกอบสำหรับแต่ละหมวด  

        ---
        ## คำถาม:
        {question}

        ## คำตอบของนักศึกษา:
        {student_answer}

        ## เฉลยอาจารย์:
        {answer_key}
        ---

        โปรดประเมินคำตอบโดยให้คะแนนระหว่าง 0 ถึง 40 พร้อมคำอธิบาย
        เริ่มต้นคำตอบด้วย:

        คะแนนเต็ม: X/40
        ข้อล่ะ X/10

        จากนั้นแสดงการเปรียบเทียบในแต่ละประเด็นสำคัญดังนี้:

        1. ข้อที่ 1
        คำตอบนักศึกษา: [ข้อความจากคำตอบนักศึกษาในประเด็นนี้]
        เฉลยอาจารย์: [ข้อความจากเฉลยในประเด็นนี้]
        การประเมิน: [อธิบายว่าคำตอบถูกต้องหรือไม่อย่างไร ระบุคีย์เวิร์ดสำคัญที่นักศึกษาตอบถูกหรือตอบขาดไป]
        คะแนน: [คะแนนที่ให้ในข้อนี้ อธิบายว่าทำไมจึงให้คะแนนเท่านี้มีอะไรบ้างที่ทำให้ได้เลขนี้ออกมา ตามเกณฑ์ที่กำหนด]

        2. ข้อที่ 2
        คำตอบนักศึกษา: [ข้อความจากคำตอบนักศึกษาในประเด็นนี้]
        เฉลยอาจารย์: [ข้อความจากเฉลยในประเด็นนี้]
        การประเมิน: [อธิบายว่าคำตอบถูกต้องหรือไม่อย่างไร ระบุคีย์เวิร์ดสำคัญที่นักศึกษาตอบถูกหรือตอบขาดไป]
        คะแนน: [คะแนนที่ให้ในข้อนี้ อธิบายว่าทำไมจึงให้คะแนนเท่านี้มีอะไรบ้างที่ทำให้ได้เลขนี้ออกมา ตามเกณฑ์ที่กำหนด]

        3. ข้อที่ 3
        คำตอบนักศึกษา: [ข้อความจากคำตอบนักศึกษาในประเด็นนี้]
        เฉลยอาจารย์: [ข้อความจากเฉลยในประเด็นนี้]
        การประเมิน: [อธิบายว่าคำตอบถูกต้องหรือไม่อย่างไร ระบุคีย์เวิร์ดสำคัญที่นักศึกษาตอบถูกหรือตอบขาดไป]
        คะแนน: [คะแนนที่ให้ในข้อนี้ อธิบายว่าทำไมจึงให้คะแนนเท่านี้มีอะไรบ้างที่ทำให้ได้เลขนี้ออกมา ตามเกณฑ์ที่กำหนด]

        4. ข้อที่ 4
        คำตอบนักศึกษา: [ข้อความจากคำตอบนักศึกษาในประเด็นนี้]
        เฉลยอาจารย์: [ข้อความจากเฉลยในประเด็นนี้]
        การประเมิน: [อธิบายว่าคำตอบถูกต้องหรือไม่อย่างไร ระบุคีย์เวิร์ดสำคัญที่นักศึกษาตอบถูกหรือตอบขาดไป]
        คะแนน: [คะแนนที่ให้ในข้อนี้ อธิบายว่าทำไมจึงให้คะแนนเท่านี้มีอะไรบ้างที่ทำให้ได้เลขนี้ออกมา ตามเกณฑ์ที่กำหนด]

        ## สรุปเหตุผลการให้คะแนน:
        [อธิบายโดยรวมว่าทำไมจึงให้คะแนนเท่านี้ ระบุจุดแข็งและจุดอ่อนหลักของคำตอบ]
        """
        
    def create_evaluation_graph(self):
        """
        สร้าง graph สำหรับการประเมินคำตอบ
        
        Returns:
            StateGraph สำหรับการประเมินคำตอบ
        """
        # สร้าง graph การประมวลผล
        workflow = StateGraph(EvaluationState)
        
        # Add nodes
        workflow.add_node("retrieve", self._retrieve)
        workflow.add_node("evaluate", self._evaluate)
        
        # Add edges
        workflow.add_edge(START, "retrieve")
        workflow.add_edge("retrieve", "evaluate")
        workflow.set_entry_point("retrieve")
        
        return workflow.compile()
    
    def _retrieve(self, state: EvaluationState):
        """
        ค้นหาข้อมูลที่เกี่ยวข้องจากเฉลย
        
        Args:
            state: สถานะปัจจุบันของการประเมิน
            
        Returns:
            ข้อมูลบริบทที่พบ
        """
        query = self._create_query_from_state(state)
        retrieved_docs = self.rag_service.retrieve_relevant_context(
            query=query,
            subject_id=state['subject_id'],
            question_id=state['question_id']
        )
        return {"context": retrieved_docs}
    
    def _create_query_from_state(self, state):
        """
        สร้างคำค้นหาจากสถานะ
        
        Args:
            state: สถานะปัจจุบันของการประเมิน
            
        Returns:
            คำค้นหาสำหรับการค้นคืนข้อมูล
        """
        return f"คำถาม: {state['question']}\nคำตอบนักศึกษา: {state['student_answer']}"
    
    def _evaluate(self, state: EvaluationState):
        """
        ประเมินคำตอบนักเรียนเทียบกับเฉลย
        
        Args:
            state: สถานะปัจจุบันของการประเมิน
            
        Returns:
            ผลการประเมิน
        """
        # รวมเนื้อหาจากเอกสารบริบท
        docs_content = self._prepare_context_content(state["context"])
        
        # สร้าง prompt สำหรับการประเมิน
        prompt_value = self._create_evaluation_prompt(
            state["question"],
            state["student_answer"],
            docs_content
        )
        
        # ส่งคำถามไปยัง LLM
        response = self.llm.invoke(prompt_value)
        result = response.content
        
        # แยกคะแนนและการประเมิน
        score = self._extract_score_from_result(result)
        
        return {
            "evaluation": result,
            "score": score
        }
    
    def _prepare_context_content(self, context_docs):
        """
        รวมเนื้อหาจากเอกสารบริบท
        
        Args:
            context_docs: รายการเอกสารบริบท
            
        Returns:
            เนื้อหาที่รวมเป็นข้อความเดียว
        """
        return "\n\n".join(doc.page_content for doc in context_docs)
    
    def _create_evaluation_prompt(self, question, student_answer, answer_key_content):
        """
        สร้าง prompt สำหรับการประเมิน
        
        Args:
            question: คำถาม
            student_answer: คำตอบของนักเรียน
            answer_key_content: เนื้อหาเฉลย
            
        Returns:
            prompt ที่จัดรูปแบบแล้ว
        """
        return self.prompt.format(
            question=question,
            student_answer=student_answer,
            answer_key=answer_key_content
        )
    
    def _extract_score_from_result(self, result_text, default_score=20.0):
        """
        แยกคะแนนจากผลลัพธ์การประเมิน
        
        Args:
            result_text: ข้อความผลลัพธ์
            default_score: คะแนนเริ่มต้นกรณีไม่พบคะแนน
            
        Returns:
            คะแนนที่แยกได้
        """
        try:
            # ค้นหาบรรทัดที่มีคำว่า "คะแนนเต็ม: X/40"
            lines = result_text.split("\n")
            for line in lines:
                if "คะแนนเต็ม:" in line:
                    # แยกคะแนนจากข้อความ "คะแนนเต็ม: X/40"
                    score_text = line.replace("คะแนนเต็ม:", "").strip().split("/")[0]
                    return float(score_text)
        except Exception as e:
            print(f"Error extracting score: {str(e)}")
        
        # กรณีไม่สามารถแยกคะแนนได้ ใช้ค่าเริ่มต้น
        return default_score
    
    def evaluate_answer(self, question, student_answer, subject_id, question_id):
        """
        ประเมินคำตอบของนักเรียน
        
        Args:
            question: คำถาม
            student_answer: คำตอบของนักเรียน
            subject_id: รหัสวิชา
            question_id: รหัสคำถาม
            
        Returns:
            ผลการประเมิน
        """
        graph = self.create_evaluation_graph()
        initial_state = {
            "question": question,
            "student_answer": student_answer,
            "subject_id": subject_id,
            "question_id": question_id
        }
        return graph.invoke(initial_state)