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

        ---
        ## คำถาม:
        {question}

        ## คำตอบของนักศึกษา:
        {student_answer}

        ## เฉลยอาจารย์:
        {answer_key}
        ---

        โปรดประเมินคำตอบโดยแยกให้คะแนนในแต่ละข้อย่อย (ถ้ามี) ตามเกณฑ์ที่ระบุในเฉลย
        แต่ละข้อมีคะแนนเต็ม 10 คะแนน 

        รูปแบบการตอบ:

        ### ข้อที่ 1:
        คะแนน: X/10
        คำตอบนักศึกษา: [ข้อความจากคำตอบนักศึกษาในข้อนี้]
        เฉลยอาจารย์: [ข้อความจากเฉลยในข้อนี้]
        การประเมิน: [อธิบายว่าคำตอบถูกต้องหรือไม่อย่างไร ระบุคีย์เวิร์ดสำคัญที่นักศึกษาตอบถูกหรือตอบขาดไป]

        ### ข้อที่ 2:
        คะแนน: X/10
        คำตอบนักศึกษา: [ข้อความจากคำตอบนักศึกษาในข้อนี้]
        เฉลยอาจารย์: [ข้อความจากเฉลยในข้อนี้]
        การประเมิน: [อธิบายว่าคำตอบถูกต้องหรือไม่อย่างไร ระบุคีย์เวิร์ดสำคัญที่นักศึกษาตอบถูกหรือตอบขาดไป]

        [ทำเช่นนี้จนครบทุกข้อย่อย]

        ### สรุปคะแนนรวม:
        ข้อที่ 1: X/10
        ข้อที่ 2: X/10
        ข้อที่ 3: X/10
        ข้อที่ 4: X/10
        
        คะแนนรวม: XX/40 (หรือตามจำนวนข้อที่มี)
        
        ### เหตุผลการให้คะแนนโดยรวม:
        [อธิบายภาพรวมของคำตอบ จุดเด่น จุดด้อย และข้อเสนอแนะเพิ่มเติม]
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
    
    def _extract_score_from_result(self, result_text, default_score=5.0):
        """
        แยกคะแนนจากผลลัพธ์การประเมิน
        
        Args:
            result_text: ข้อความผลลัพธ์
            default_score: คะแนนเริ่มต้นกรณีไม่พบคะแนน
            
        Returns:
            คะแนนที่แยกได้
        """
        try:
            # ตรวจสอบบรรทัดแรกของผลลัพธ์
            first_line = result_text.split("\n")[0]
            
            if "คะแนน:" in first_line:
                # แยกคะแนนจากข้อความ "คะแนน: X/10"
                score_text = first_line.replace("คะแนน:", "").strip().split("/")[0]
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
    

    def _extract_question_scores(self, result_text):
        """
        แยกคะแนนของแต่ละข้อย่อยจากผลลัพธ์การประเมิน
        
        Args:
            result_text: ข้อความผลลัพธ์
            
        Returns:
            รายการคะแนนของแต่ละข้อย่อย
        """
        question_scores = []
        lines = result_text.split('\n')
        
        current_question = None
        current_score = None
        current_feedback = []
        
        for line in lines:
            line = line.strip()
            
            # ตรวจจับหัวข้อ "ข้อที่ X:"
            if line.startswith('### ข้อที่') and ':' in line:
                # บันทึกข้อมูลข้อก่อนหน้า (ถ้ามี)
                if current_question is not None and current_score is not None:
                    question_scores.append({
                        'question_number': current_question,
                        'score': current_score,
                        'feedback': '\n'.join(current_feedback)
                    })
                
                # เริ่มข้อใหม่
                try:
                    current_question = int(line.split('ข้อที่')[1].split(':')[0].strip())
                    current_feedback = []
                except:
                    current_question = len(question_scores) + 1
            
            # ตรวจจับคะแนนในแต่ละข้อ
            elif 'คะแนน:' in line and current_question is not None:
                try:
                    score_text = line.replace('คะแนน:', '').strip().split('/')[0]
                    current_score = float(score_text)
                except:
                    current_score = 0
            
            # เก็บข้อความประเมินสำหรับข้อนั้นๆ
            elif current_question is not None and line and not line.startswith('### '):
                current_feedback.append(line)
        
        # บันทึกข้อมูลข้อสุดท้าย (ถ้ามี)
        if current_question is not None and current_score is not None:
            question_scores.append({
                'question_number': current_question,
                'score': current_score,
                'feedback': '\n'.join(current_feedback)
            })
        
        return question_scores

    def _extract_total_score(self, result_text):
        """
        แยกคะแนนรวมจากผลลัพธ์การประเมิน
        
        Args:
            result_text: ข้อความผลลัพธ์
            
        Returns:
            คะแนนรวมที่แยกได้
        """
        try:
            # ค้นหาส่วนที่มีคะแนนรวม
            if "คะแนนรวม:" in result_text:
                total_score_line = [line for line in result_text.split('\n') if "คะแนนรวม:" in line][0]
                # แยกคะแนนจากข้อความ "คะแนนรวม: XX/40"
                score_parts = total_score_line.replace("คะแนนรวม:", "").strip().split('/')
                return float(score_parts[0].strip()), float(score_parts[1].strip())
            else:
                # ถ้าไม่พบคะแนนรวมโดยตรง ให้คำนวณจากคะแนนแต่ละข้อ
                question_scores = self._extract_question_scores(result_text)
                total_score = sum(item['score'] for item in question_scores)
                total_max_score = len(question_scores) * 10.0  # คะแนนเต็มข้อละ 10
                return total_score, total_max_score
        except Exception as e:
            print(f"Error extracting total score: {str(e)}")
            return 0.0, 0.0