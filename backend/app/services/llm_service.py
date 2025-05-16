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
        โปรดประเมินคำตอบของนักศึกษาโดยเปรียบเทียบกับเฉลยที่ระบบดึงมาจากฐานความรู้เท่านั้น  
        **ห้ามอ้างอิงความรู้ของคุณเองหรือเสริมข้อมูลนอกเหนือจากเนื้อหาในเฉลย**

        หากไม่มีข้อมูลเพียงพอในการประเมินในแต่ละประเด็น ให้ระบุว่า:  
        **"ไม่สามารถประเมินได้เนื่องจากไม่มีข้อมูลเฉลยเพียงพอ"**

        ---

        ## คำถาม:
        {question}

        ## คำตอบของนักศึกษา:
        {student_answer}

        ## เฉลยอาจารย์:
        {answer_key}

        ---

        โปรดประเมินคำตอบโดยแบ่งเป็น **4 ประเด็นสำคัญ** (หรือมากกว่านี้ถ้าเฉลยมีหลายหัวข้อย่อย)  
        แต่ละประเด็นให้คะแนนเต็ม 5 คะแนน แล้ว **สรุปคะแนนรวม**

        เริ่มต้นคำตอบของคุณด้วย:

        ---

        ## ผลการประเมินคะแนน:
        1. ประเด็นที่ 1: [คะแนน]/5  
        2. ประเด็นที่ 2: [คะแนน]/5  
        3. ประเด็นที่ 3: [คะแนน]/5  
        4. ประเด็นที่ 4: [คะแนน]/5  
        **คะแนนรวม: [คะแนนรวม]/20**

        ---

        จากนั้นแสดงการวิเคราะห์ในแต่ละประเด็นดังนี้:

        ## การวิเคราะห์คำตอบ:

        1. **ประเด็นที่ 1**  
        - คำตอบนักศึกษา: “[ข้อความจากคำตอบนักศึกษาในประเด็นนี้]”  
        - เฉลยอาจารย์: “[ข้อความจากเฉลยในประเด็นนี้]”  
        - การประเมิน: [อธิบายว่าคำตอบถูกต้องหรือไม่อย่างไร ระบุคีย์เวิร์ดสำคัญที่นักศึกษาตอบถูกหรือตอบขาดไป]  
        - คะแนน: [คะแนน]/5 เนื่องจาก [ระบุเหตุผลสั้นกระชับ]

        2. **ประเด็นที่ 2**  
        - คำตอบนักศึกษา: “[...]”  
        - เฉลยอาจารย์: “[...]”  
        - การประเมิน: [...]  
        - คะแนน: [...]/5 เนื่องจาก [...]

        [ทำแบบเดียวกันจนจบทุกประเด็น]

        ---

        ## สรุปเหตุผลการให้คะแนน:
        [สรุปภาพรวมว่าทำไมจึงให้คะแนนระดับนั้น ระบุจุดแข็ง จุดอ่อน และคำแนะนำหากเหมาะสม]
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
    
    def _extract_scores_from_result(self, result_text):
        """
        แยกคะแนนจากผลลัพธ์การประเมิน
        
        Args:
            result_text: ข้อความผลลัพธ์
            
        Returns:
            dict ที่มีคะแนนรายข้อและคะแนนรวม
        """
        try:
            # แยกประโยคที่มีคะแนน
            lines = result_text.split('\n')
            scores = []
            total_score = 0
            max_score = 0
            
            # ค้นหาบรรทัดที่มีรูปแบบ "ประเด็นที่ X: [คะแนน]/5"
            for line in lines:
                if ':/5' in line and ('ประเด็นที่' in line or any(f"{i}." in line for i in range(1, 10))):
                    try:
                        # ดึงหมายเลขข้อ
                        question_number = 0
                        if 'ประเด็นที่' in line:
                            parts = line.split('ประเด็นที่')
                            if len(parts) > 1:
                                # ดึงตัวเลขหลัง "ประเด็นที่"
                                for c in parts[1]:
                                    if c.isdigit():
                                        question_number = int(c)
                                        break
                        else:
                            # หาตัวเลขข้อจากรูปแบบ "1. ข้อความ"
                            for i in range(1, 10):
                                if f"{i}." in line:
                                    question_number = i
                                    break
                        
                        # ดึงคะแนน
                        score_text = line.split(':')[1].strip().split('/')[0].strip()
                        max_score_text = line.split('/')[1].strip()
                        
                        score = float(score_text)
                        current_max_score = float(max_score_text)
                        
                        # หา feedback (ถ้ามี)
                        feedback = ""
                        index = lines.index(line)
                        if index + 1 < len(lines) and 'เนื่องจาก' in lines[index + 1]:
                            feedback = lines[index + 1].strip()
                        
                        scores.append({
                            "question_number": question_number,
                            "score": score,
                            "max_score": current_max_score,
                            "feedback": feedback
                        })
                        
                        max_score += current_max_score
                    except Exception as e:
                        print(f"Error parsing score line: {line}, error: {str(e)}")
                
                # ค้นหาบรรทัดที่มีคะแนนรวม
                if 'คะแนนรวม:' in line:
                    try:
                        total_text = line.split('คะแนนรวม:')[1].strip().split('/')[0].strip()
                        total_score = float(total_text)
                    except:
                        # หากมีข้อผิดพลาด คำนวณคะแนนรวมเอง
                        total_score = sum(item["score"] for item in scores)
            
            # ถ้าไม่พบคะแนนรวม คำนวณเอง
            if total_score == 0:
                total_score = sum(item["score"] for item in scores)
            
            # ถ้าไม่พบคะแนนเต็ม คำนวณเอง
            if max_score == 0:
                max_score = sum(item["max_score"] for item in scores)
            
            return {
                "scores": scores,
                "total_score": total_score,
                "max_score": max_score
            }
        except Exception as e:
            print(f"Error extracting scores: {str(e)}")
            # กรณีมีข้อผิดพลาด ให้คืนค่าเริ่มต้น
            return {
                "scores": [{"question_number": 1, "score": 0, "max_score": 5, "feedback": ""}],
                "total_score": 0,
                "max_score": 5
            }
    
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
        
        result = graph.invoke(initial_state)
        
        # แยกคะแนนจากผลการประเมิน
        scores_data = self._extract_scores_from_result(result["evaluation"])
        
        # อัปเดต result ด้วยข้อมูลคะแนน
        result.update({
            "scores": scores_data["scores"],
            "total_score": scores_data["total_score"],
            "max_score": scores_data["max_score"]
        })
        
        return result