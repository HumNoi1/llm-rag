"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import supabase from '@/lib/supabase';

export default function CompareEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  const questionId = searchParams.get('questionId');

  // สถานะสำหรับข้อมูลการเปรียบเทียบและการประเมิน
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [question, setQuestion] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);

  // ดึงข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    if (!classId || !questionId) {
      setError('ไม่พบข้อมูลรายวิชาหรือคำถาม');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);

        // ดึงข้อมูลรายวิชา
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();

        if (classError) throw classError;
        setClassInfo(classData);

        // จำลองการดึงข้อมูลคำถาม เฉลย และคำตอบนักเรียน
        // ในอนาคตควรดึงจากฐานข้อมูลหรือ API จริง
        setQuestion('อธิบายหลักการของวิศวกรรมซอฟต์แวร์และการนำไปประยุกต์ใช้');
        
        setAnswerKey(`วิศวกรรมซอฟต์แวร์ (Software Engineering) เป็นวิศาสตร์ที่เกี่ยวกับการพัฒนาซอฟต์แวร์อย่างเป็นระบบ มีหลักการสำคัญดังนี้:

1. การวางแผนและวิเคราะห์ความต้องการ: เป็นขั้นตอนแรกในการพัฒนาซอฟต์แวร์ โดยเก็บรวบรวมข้อมูลความต้องการจากผู้ใช้ วิเคราะห์ความเป็นไปได้ และกำหนดขอบเขตโครงการ

2. การออกแบบซอฟต์แวร์: ออกแบบสถาปัตยกรรม โครงสร้างข้อมูล อินเทอร์เฟส และองค์ประกอบอื่นๆ ของระบบซอฟต์แวร์

3. การพัฒนา/เขียนโค้ด: พัฒนาตามการออกแบบโดยใช้หลักการเขียนโค้ดที่ดี (Clean Code, SOLID Principles)

4. การทดสอบ: ทดสอบซอฟต์แวร์ในหลายระดับ เช่น Unit Testing, Integration Testing, System Testing, User Acceptance Testing

5. การนำไปใช้และบำรุงรักษา: ติดตั้งซอฟต์แวร์ในสภาพแวดล้อมจริงและดูแลรักษา ปรับปรุงเมื่อพบข้อผิดพลาดหรือต้องการเพิ่มฟีเจอร์ใหม่

วงจรชีวิตการพัฒนาซอฟต์แวร์มีหลายรูปแบบ เช่น Waterfall, Agile, Spiral, V-Model แต่ละแบบเหมาะกับสถานการณ์ที่แตกต่างกัน

การนำไปประยุกต์ใช้:
- การพัฒนาซอฟต์แวร์ทางธุรกิจ: ใช้ในการพัฒนาระบบที่มีความซับซ้อนสูง เช่น ระบบ ERP, CRM
- การพัฒนาเกม: ใช้หลักการ OOD และ Design Patterns ในการสร้างเกมที่มีประสิทธิภาพ
- การพัฒนาแอปพลิเคชันมือถือ: ใช้วิธี Agile เพื่อปรับตัวกับความต้องการที่เปลี่ยนแปลงอย่างรวดเร็ว
- การพัฒนาซอฟต์แวร์ทางการแพทย์: เน้นการทดสอบและความน่าเชื่อถือสูง
- การพัฒนาซอฟต์แวร์ในยานยนต์: ใช้หลักการ V-Model เพื่อความปลอดภัยสูงสุด`);
        
        setStudentAnswer(`วิศวกรรมซอฟต์แวร์เป็นกระบวนการพัฒนาซอฟต์แวร์อย่างเป็นระบบ มีหลักการหลายข้อดังนี้

1. การวิเคราะห์ความต้องการ - เก็บความต้องการจากผู้ใช้
2. การออกแบบ - ออกแบบโครงสร้างของระบบ
3. การพัฒนา - เขียนโค้ดตามที่ออกแบบไว้
4. การทดสอบ - ตรวจสอบว่าระบบทำงานถูกต้อง
5. การนำไปใช้ - ติดตั้งและใช้งานจริง

วิศวกรรมซอฟต์แวร์มีแนวทางการพัฒนาหลายรูปแบบ เช่น Waterfall และ Agile ซึ่ง Waterfall จะทำทีละขั้นตอนจนเสร็จแล้วค่อยไปขั้นตอนถัดไป ส่วน Agile จะพัฒนาเป็นรอบๆ โดยมีการส่งมอบซอฟต์แวร์บ่อยครั้ง

การประยุกต์ใช้วิศวกรรมซอฟต์แวร์สามารถทำได้ในหลายด้าน เช่น
- ในธุรกิจ: พัฒนาระบบ ERP, CRM
- ในการศึกษา: พัฒนาแพลตฟอร์มการเรียนออนไลน์
- ในการแพทย์: พัฒนาระบบบันทึกข้อมูลผู้ป่วย

หลักการ SOLID เป็นหลักการสำคัญในวิศวกรรมซอฟต์แวร์ที่ช่วยให้โค้ดมีคุณภาพดี แก้ไขง่าย และขยายได้`);

        // จำลองผลการประเมิน
        fetchEvaluationResult();
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('ไม่สามารถดึงข้อมูลได้');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [classId, questionId]);

  // จำลองการดึงผลการประเมิน
  const fetchEvaluationResult = async () => {
    try {
      // ในอนาคตจะดึงจาก API จริง
      // ตัวอย่างการใช้ API
      /*
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/evaluation/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          student_answer: studentAnswer,
          subject_id: classId,
          question_id: questionId
        }),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถประเมินคำตอบได้');
      }

      const result = await response.json();
      setEvaluationResult(result);
      */

      // จำลองข้อมูลผลการประเมิน
      setTimeout(() => {
        const mockResult = {
          evaluation: `คะแนน: 8/10

1. จุดเด่นของคำตอบ
   - อธิบายหลักการของวิศวกรรมซอฟต์แวร์ได้ครบถ้วนทั้ง 5 ขั้นตอนหลัก
   - มีการกล่าวถึงแนวทางการพัฒนาซอฟต์แวร์แบบต่างๆ (Waterfall, Agile)
   - ยกตัวอย่างการนำไปประยุกต์ใช้ในหลายด้านได้ชัดเจน
   - มีการกล่าวถึงหลักการ SOLID ซึ่งเป็นหลักการสำคัญในวิศวกรรมซอฟต์แวร์

2. จุดที่ขาดหรือไม่ถูกต้อง
   - รายละเอียดในแต่ละขั้นตอนยังไม่ลึกเท่าที่ควร
   - ไม่ได้อธิบายความแตกต่างระหว่าง Agile และ Waterfall อย่างชัดเจน
   - ขาดการอธิบายถึงความสำคัญของการทดสอบในรายละเอียด
   - ไม่ได้กล่าวถึงเครื่องมือที่ใช้ในวิศวกรรมซอฟต์แวร์

3. ข้อเสนอแนะในการปรับปรุง
   - ควรอธิบายแต่ละขั้นตอนให้มีรายละเอียดมากขึ้น
   - ควรอธิบายหลักการ SOLID ให้ละเอียดพร้อมยกตัวอย่าง
   - ควรกล่าวถึงเครื่องมือที่ใช้ในวิศวกรรมซอฟต์แวร์ เช่น ระบบควบคุมเวอร์ชัน เครื่องมือทดสอบอัตโนมัติ
   - ควรเชื่อมโยงการนำไปประยุกต์ใช้กับขั้นตอนต่างๆ ของวิศวกรรมซอฟต์แวร์ให้ชัดเจนยิ่งขึ้น`,
          score: 8.0,
          subject_id: classId,
          question_id: questionId
        };
        setEvaluationResult(mockResult);
      }, 1000);
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      setError('ไม่สามารถดึงผลการประเมินได้');
    }
  };

  // ฟังก์ชันสำหรับเน้นคำสำคัญในข้อความ
  const highlightKeywords = (text, keywords) => {
    let highlightedText = text;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<span class="bg-yellow-200">$1</span>');
    });
    
    return highlightedText;
  };

  // แสดงหน้า loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        <main className="container mx-auto p-4 md:p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-700">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // แสดงข้อความผิดพลาด
  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        <main className="container mx-auto p-4 md:p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p>{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
            >
              กลับไปหน้าแดชบอร์ด
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />
      
      <main className="container mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#333333]">เปรียบเทียบคำตอบและเฉลย</h1>
            <p className="text-gray-600">{classInfo?.name} ({classInfo?.code}) - คำถามรหัส: {questionId}</p>
          </div>
          <div className="flex space-x-4">
            <Link 
              href={`/class/${classId}/evaluation/${questionId}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
            >
              ดูผลการประเมิน
            </Link>
            <PrimaryButtonLink href={`/class/${classId}`}>
              กลับไปหน้ารายวิชา
            </PrimaryButtonLink>
          </div>
        </div>
        
        {/* ส่วนแสดงคำถาม */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-[#333333] mb-4">คำถาม</h2>
          <p className="text-gray-700">{question}</p>
        </div>
        
        {/* ส่วนเปรียบเทียบคำตอบ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* เฉลยของอาจารย์ */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              เฉลยของอาจารย์
            </h2>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[500px]">
              <div className="whitespace-pre-line text-gray-700">
                {answerKey}
              </div>
            </div>
          </div>
          
          {/* คำตอบของนักเรียน */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              คำตอบของนักเรียน
            </h2>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[500px]">
              <div className="whitespace-pre-line text-gray-700">
                {studentAnswer}
              </div>
            </div>
          </div>
        </div>
        
        {/* ส่วนแสดงผลการประเมิน */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-[#333333] mb-4">ผลการประเมิน</h2>
          
          {!evaluationResult ? (
            <div className="text-center p-8">
              <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-700">กำลังประเมินผล... โปรดรอสักครู่</p>
            </div>
          ) : (
            <div>
              {/* แสดงผลคะแนน */}
              <div className="mb-6 flex items-center">
                <div className="bg-blue-100 rounded-full h-24 w-24 flex items-center justify-center mr-4">
                  <span className="text-blue-700 text-2xl font-bold">{evaluationResult.score}/10</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#333333]">คะแนนที่ได้</h3>
                  <p className="text-gray-600">ผลการประเมินโดย AI</p>
                </div>
              </div>
              
              {/* แสดงรายละเอียดการประเมิน */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-[#333333] mb-2">รายละเอียดการประเมิน</h3>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                  {evaluationResult.evaluation}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* ส่วนการวิเคราะห์คำตอบ */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-[#333333] mb-4">การวิเคราะห์การเปรียบเทียบ</h2>
          
          <div className="mb-6">
            <h3 className="font-medium text-[#333333] mb-2">คำสำคัญที่พบในคำตอบ</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {['วิศวกรรมซอฟต์แวร์', 'วิเคราะห์', 'ออกแบบ', 'พัฒนา', 'ทดสอบ', 'นำไปใช้', 'Waterfall', 'Agile', 'SOLID'].map((keyword) => (
                <span key={keyword} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {keyword}
                </span>
              ))}
            </div>
            
            <h3 className="font-medium text-[#333333] mb-2">คำสำคัญที่ขาดไปในคำตอบ</h3>
            <div className="flex flex-wrap gap-2">
              {['เครื่องมือทดสอบ', 'ระบบควบคุมเวอร์ชัน', 'V-Model', 'Spiral', 'DevOps'].map((keyword) => (
                <span key={keyword} className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-[#333333] mb-2">คำแนะนำสำหรับการปรับปรุงการสอน</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>เน้นย้ำความแตกต่างระหว่างแนวทางการพัฒนาแบบ Waterfall และ Agile ให้ชัดเจนยิ่งขึ้น</li>
              <li>อธิบายเพิ่มเติมเกี่ยวกับเครื่องมือที่ใช้ในวิศวกรรมซอฟต์แวร์</li>
              <li>เพิ่มตัวอย่างกรณีศึกษาเพื่อให้เห็นภาพการนำไปใช้จริง</li>
              <li>อธิบายหลักการ SOLID ให้ละเอียดมากขึ้นพร้อมยกตัวอย่างประกอบ</li>
              <li>เพิ่มเนื้อหาเกี่ยวกับการทดสอบซอฟต์แวร์ให้ครอบคลุมมากขึ้น</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}