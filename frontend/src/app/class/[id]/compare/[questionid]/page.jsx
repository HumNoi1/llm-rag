"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { PrimaryButtonLink, SecondaryButtonLink } from '@/components/ui/NavLink';
import ProtectedRoute from '@/components/ProtectedRoute';
import supabase from '@/lib/supabase';

export default function ComparePage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id;
  const questionId = params.questionid;

  // สถานะสำหรับข้อมูลการเปรียบเทียบและการประเมิน
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [question, setQuestion] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [highlightedKeywords, setHighlightedKeywords] = useState([]);

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

        // สร้าง endpoint ตรงนี้เพื่อดึงข้อมูลคำถาม, คำตอบนักเรียน, และเฉลยอาจารย์
        // ในตัวอย่างนี้ใช้ข้อมูลจำลอง แต่ในระบบจริงควรดึงจาก API
        
        // จำลองการดึงข้อมูลคำถาม
        setQuestion('อธิบายหลักการของวิศวกรรมซอฟต์แวร์และการนำไปประยุกต์ใช้');
        
        // จำลองการดึงเฉลยของอาจารย์
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
        
        // จำลองการดึงคำตอบของนักเรียน
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

        // ตั้งค่าคำสำคัญที่จะไฮไลท์
        setHighlightedKeywords([
          'วิศวกรรมซอฟต์แวร์', 'การวิเคราะห์', 'ความต้องการ', 'การออกแบบ', 
          'การพัฒนา', 'การทดสอบ', 'การนำไปใช้', 'Waterfall', 'Agile',
          'Unit Testing', 'Integration Testing', 'System Testing', 'SOLID'
        ]);

        // ดึงผลการประเมิน
        await fetchEvaluationResult();
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('ไม่สามารถดึงข้อมูลได้');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [classId, questionId]);

  // จำลองการดึงผลการประเมิน (ในระบบจริงจะดึงจาก API)
  const fetchEvaluationResult = async () => {
    try {
      // จำลองการเรียก API
      setTimeout(() => {
        setEvaluationResult({
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
          question_id: questionId,
          foundKeywords: [
            'วิศวกรรมซอฟต์แวร์', 'การวิเคราะห์', 'ความต้องการ', 'การออกแบบ', 
            'การพัฒนา', 'การทดสอบ', 'การนำไปใช้', 'Waterfall', 'Agile', 'SOLID'
          ],
          missingKeywords: [
            'V-Model', 'Spiral', 'Unit Testing', 'Integration Testing', 
            'System Testing', 'User Acceptance Testing', 'Clean Code'
          ]
        });
      }, 800);
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      setError('ไม่สามารถดึงผลการประเมินได้');
    }
  };

  // ฟังก์ชันสำหรับไฮไลท์คำสำคัญในข้อความ
  const highlightText = (text, keywords) => {
    if (!text || !keywords || keywords.length === 0) return text;

    let result = text;
    keywords.forEach(keyword => {
      // สร้าง regex ที่ไม่สนใจตัวพิมพ์เล็ก/ใหญ่
      const regex = new RegExp(`(${keyword})`, 'gi');
      // แทนที่คำด้วย span ที่มี class สำหรับการไฮไลท์
      result = result.replace(regex, '<span class="bg-yellow-200">$1</span>');
    });

    return result;
  };

  // แสดงหน้า loading
  if (loading) {
    return (
      <ProtectedRoute>
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
      </ProtectedRoute>
    );
  }

  // แสดงข้อความผิดพลาด
  if (error) {
    return (
      <ProtectedRoute>
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
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        
        <main className="container mx-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#333333]">เปรียบเทียบคำตอบและเฉลย</h1>
              <p className="text-gray-600">{classInfo?.name} - คำถามรหัส: {questionId}</p>
            </div>
            <div className="flex space-x-4">
              <SecondaryButtonLink href={`/class/${classId}`}>
                กลับไปหน้ารายวิชา
              </SecondaryButtonLink>
              <PrimaryButtonLink href={`/evaluation/${classId}/${questionId}`}>
                ดูผลการประเมินทั้งหมด
              </PrimaryButtonLink>
            </div>
          </div>
          
          {/* ส่วนแสดงคำถาม */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              คำถาม
            </h2>
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-gray-800">{question}</p>
            </div>
          </div>
          
          {/* ส่วนเปรียบเทียบคำตอบและเฉลย */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* เฉลยของอาจารย์ */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                เฉลยของอาจารย์
              </h2>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[520px]">
                <div 
                  className="whitespace-pre-line text-gray-700" 
                  dangerouslySetInnerHTML={{ 
                    __html: evaluationResult ? 
                      highlightText(answerKey, evaluationResult.foundKeywords) : 
                      answerKey 
                  }}
                />
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
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[520px]">
                <div 
                  className="whitespace-pre-line text-gray-700"
                  dangerouslySetInnerHTML={{ 
                    __html: evaluationResult ? 
                      highlightText(studentAnswer, evaluationResult.foundKeywords) : 
                      studentAnswer 
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* ส่วนแสดงผลการประเมิน */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              ผลการประเมิน
            </h2>
            
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
                    <p className="text-gray-600">
                      {evaluationResult.score >= 8 ? (
                        <span className="text-green-600">ดีมาก (80% ขึ้นไป)</span>
                      ) : evaluationResult.score >= 7 ? (
                        <span className="text-blue-600">ดี (70% ขึ้นไป)</span>
                      ) : evaluationResult.score >= 5 ? (
                        <span className="text-yellow-600">พอใช้ (50% ขึ้นไป)</span>
                      ) : (
                        <span className="text-red-600">ต้องปรับปรุง (ต่ำกว่า 50%)</span>
                      )}
                    </p>
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
          {evaluationResult && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                การวิเคราะห์การเปรียบเทียบ
              </h2>
              
              <div className="mb-6">
                <h3 className="font-medium text-[#333333] mb-2">คำสำคัญที่พบในคำตอบ</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {evaluationResult.foundKeywords.map((keyword) => (
                    <span key={keyword} className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
                
                <h3 className="font-medium text-[#333333] mb-2">คำสำคัญที่ขาดไปในคำตอบ</h3>
                <div className="flex flex-wrap gap-2">
                  {evaluationResult.missingKeywords.map((keyword) => (
                    <span key={keyword} className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium text-[#333333] mb-2">เปรียบเทียบคำตอบกับเฉลย</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเด็น</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เฉลย</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำตอบของนักเรียน</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">ขั้นตอนการพัฒนาซอฟต์แวร์</td>
                        <td className="px-6 py-4">ครบถ้วนและมีรายละเอียด</td>
                        <td className="px-6 py-4">ครบถ้วนแต่รายละเอียดน้อย</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            มีบางส่วน
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">รูปแบบการพัฒนาซอฟต์แวร์</td>
                        <td className="px-6 py-4">Waterfall, Agile, Spiral, V-Model</td>
                        <td className="px-6 py-4">Waterfall, Agile</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            มีบางส่วน
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">การทดสอบซอฟต์แวร์</td>
                        <td className="px-6 py-4">Unit Testing, Integration Testing, System Testing, User Acceptance Testing</td>
                        <td className="px-6 py-4">การทดสอบ (ไม่มีรายละเอียด)</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            ขาดรายละเอียด
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">หลักการออกแบบ</td>
                        <td className="px-6 py-4">Clean Code, SOLID Principles</td>
                        <td className="px-6 py-4">SOLID Principles</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            มีบางส่วน
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">การประยุกต์ใช้</td>
                        <td className="px-6 py-4">ธุรกิจ, เกม, แอปพลิเคชันมือถือ, การแพทย์, ยานยนต์</td>
                        <td className="px-6 py-4">ธุรกิจ, การศึกษา, การแพทย์</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            เหมาะสม
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-medium text-[#333333] mb-2">คำแนะนำสำหรับการปรับปรุงการสอน</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>เน้นย้ำความแตกต่างระหว่างแนวทางการพัฒนาแบบต่างๆ ให้ชัดเจนยิ่งขึ้น</li>
                  <li>อธิบายเพิ่มเติมเกี่ยวกับประเภทของการทดสอบแต่ละระดับ</li>
                  <li>ให้ตัวอย่างการใช้หลักการ SOLID ในการพัฒนาซอฟต์แวร์จริง</li>
                  <li>แนะนำเครื่องมือที่ใช้ในแต่ละขั้นตอนของวิศวกรรมซอฟต์แวร์</li>
                  <li>มอบหมายงานกลุ่มที่ต้องวิเคราะห์กรณีศึกษาของการพัฒนาซอฟต์แวร์จริง</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* ส่วนปุ่มดำเนินการ */}
          <div className="flex justify-end space-x-4 mt-6">
            <SecondaryButtonLink href={`/class/${classId}/evaluation/${questionId}/adjust`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              ปรับแก้คะแนน
            </SecondaryButtonLink>
            <PrimaryButtonLink href={`/class/${classId}/evaluate-next`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ตรวจข้อถัดไป
            </PrimaryButtonLink>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}