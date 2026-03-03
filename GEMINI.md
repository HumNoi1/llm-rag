# Project Context: ระบบผู้ช่วยตรวจข้อสอบด้วย LLM + RAG

โปรเจกต์นี้คือระบบอัตโนมัติสำหรับประเมินและตรวจข้อสอบโดยใช้ Large Language Models (LLMs) ผสานกับเทคโนโลยี Retrieval-Augmented Generation (RAG) เพื่อดึงข้อมูลอ้างอิงที่แม่นยำ เป้าหมายหลักคือการลดภาระงานของผู้สอน เพิ่มความแม่นยำในการตรวจ และรองรับการขยายขนาด (Scalability) ในอนาคต

## สถาปัตยกรรมและเทคโนโลยีหลัก (Tech Stack)

ระบบแบ่งออกเป็น 2 ส่วนหลักอย่างชัดเจน (Frontend และ Backend) โดยใช้ Supabase เป็นศูนย์กลางข้อมูลและการยืนยันตัวตน

1.  **Frontend (UI & Client-side Logic):**
    * **Framework:** Next.js (App Router)
    * **Library:** React.js
    * **Styling:** Tailwind CSS (ผ่าน PostCSS)
    * **State Management:** React Context (เช่น `AuthContext.jsx`)
    * **Integration:** Supabase JS Client

2.  **Backend (API, AI & Data Processing):**
    * **Framework:** FastAPI (Python 3.12)
    * **Architecture:** Layered Architecture (`routers`, `services`, `models`)
    * **AI/NLP:** LLM API Integration, RAG Pipelines
    * **Validation:** Pydantic (ใช้งานผ่าน `schemas.py`)
    * **Database Interaction:** Supabase SDK (Python)

## มาตรฐานการเขียนโค้ด (Coding Conventions)

คุณ (AI) ต้องปฏิบัติตามกฎต่อไปนี้อย่างเคร่งครัดเมื่อทำการวิเคราะห์ สร้าง หรือแก้ไขโค้ด:

### กฎทั่วไป (General Rules)
* **ความชัดเจนและตรงไปตรงมา:** เขียนโค้ดที่อ่านเข้าใจง่าย ไม่ซับซ้อนโดยไม่จำเป็น หลีกเลี่ยงการเขียนโค้ดที่ต้องตีความหรือคาดเดาการทำงาน
* **Forward-thinking:** ใช้ฟีเจอร์และไวยากรณ์สมัยใหม่ (เช่น Async/Await เต็มรูปแบบ, Type Hinting ใน Python 3.12, Server Components ใน Next.js)
* **Performance:** ตระหนักถึงประสิทธิภาพเสมอ โดยเฉพาะใน RAG Pipeline และ LLM API Calls ต้องมีการจัดการ Timeout และ Error Handling ที่รัดกุม

### กฎสำหรับ Backend (Python/FastAPI)
1.  **Type Hinting:** ฟังก์ชันและเมธอดทั้งหมดต้องระบุ Type Hint อย่างครบถ้วน ทั้งพารามิเตอร์และค่าที่ส่งคืน (Return Types)
2.  **Separation of Concerns:** * `routers/`: จัดการเฉพาะ HTTP Request/Response และ Data Validation (ผ่าน Pydantic) ห้ามมี Business Logic ที่ซับซ้อนในนี้
    * `services/`: จัดการ Business Logic, RAG Pipeline และการเรียกใช้ภายนอก (LLM, Supabase)
3.  **Error Handling:** ห้ามใช้ `try-except` แบบกว้างๆ (catch-all) ให้ดักจับ Exception เฉพาะเจาะจง และส่ง HTTP Exception กลับไปยัง Client ด้วย Status Code ที่ถูกต้อง

### กฎสำหรับ Frontend (Next.js/React)
1.  **App Router Paradigm:** ใช้ Server Components เป็นค่าเริ่มต้น ใช้ Client Components (`"use client"`) เฉพาะเมื่อจำเป็นต้องจัดการ State, Lifecycle หรือ Event Listeners เท่านั้น
2.  **Component Structure:** แยก UI Components (`/components`) ออกจาก Page Components (`/app`) อย่างชัดเจน
3.  **Styling:** ใช้ Tailwind CSS utility classes เป็นหลัก หลีกเลี่ยงการเขียน Custom CSS เว้นแต่จำเป็นจริงๆ

## การทดสอบและประเมินผล (Testing & Evaluation)
* โปรเจกต์นี้ให้ความสำคัญกับการประเมินผลลัพธ์ของ AI (Evaluation) โดยมีสคริปต์การทดสอบและผลลัพธ์ที่จัดเก็บอย่างเป็นระบบ (เช่น `Cohen_kappa.py`, สคริปต์ในโฟลเดอร์ `Test/` และ `backend/tests/`)
* เมื่อมีการปรับปรุง RAG Pipeline หรือเปลี่ยนโมเดล ต้องคำนึงถึงผลกระทบต่อความแม่นยำของการตรวจข้อสอบ และสร้าง/อัปเดต Unit Tests ที่เกี่ยวข้องเสมอ

## ข้อห้าม (Strict Prohibitions)
* ห้ามเปิดเผยข้อมูลที่ละเอียดอ่อน (API Keys, Secrets) ในโค้ดหรือคอมมิต ให้ใช้ Environment Variables (`.env`) เท่านั้น
* ห้ามเพิ่ม Dependencies หรือ Libraries ใหม่โดยไม่จำเป็น หากฟังก์ชันนั้นสามารถเขียนเองได้อย่างมีประสิทธิภาพ
* ไม่ต้องแสดงคำขอโทษหรือใช้ถ้อยคำอ้อมค้อมในคอมเมนต์โค้ด ให้เน้นที่บริบททางเทคนิคเท่านั้น