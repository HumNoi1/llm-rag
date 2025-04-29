// frontend/src/app/class/[id]/evaluation/[questionId]/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';

export default function EvaluationResultPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id;
  const questionId = params.questionId;
  const { user } = useAuth();

  // สถานะสำหรับข้อมูล
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [error, setError] = useState('');

  // ดึงข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
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
        
        // ดึงข้อมูลการอัปโหลด
        const { data: uploadData, error: uploadError } = await supabase
          .from('uploads')
          .select('*')
          .eq('class_id', classId)
          .eq('question_id', questionId)
          .order('uploaded_at', { ascending: false })
          .limit(1)
          .single();
          
        if (uploadError && uploadError.code !== 'PGRST116') { // PGRST116 = ไม่พบข้อมูล
          throw uploadError;
        }
        
        setUploadInfo(uploadData);
        
        // ถ้ามีผลการประเมินแล้ว
        if (uploadData?.evaluation_result) {
          setEvaluationResult(uploadData.evaluation_result);
        } else {
          // ยังไม่มีผลการประเมิน ทำการร้องขอผลการประเมิน
          await requestEvaluation();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้งหรือตรวจสอบว่าคุณมีสิทธิ์ในการเข้าถึงข้อมูลนี้');
      } finally {
        setLoading(false);
      }
    }

    if (classId && questionId) {
      fetchData();
    }
  }, [classId, questionId]);

  // ร้องขอผลการประเมิน
  const requestEvaluation = async () => {
    try {
      // สร้างข้อมูลสำหรับร้องขอการประเมิน
      const evalRequest = {
        question: "โปรดประเมินคำตอบของนักเรียนเปรียบเทียบกับเฉลย",
        student_answer: "ข้อมูลจากไฟล์คำตอบนักเรียน",
        subject_id: classId,
        question_id: questionId
      };
      
      // ส่งคำขอไปยัง API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/evaluation/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evalRequest),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถประเมินคำตอบได้');
      }

      const result = await response.json();
      setEvaluationResult(result);
      
      // บันทึกผลการประเมินลงในฐานข้อมูล
      if (uploadInfo) {
        await supabase
          .from('uploads')
          .update({
            evaluation_result: result,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', uploadInfo.id);
      }
    } catch (error) {
      console.error('Error requesting evaluation:', error);
      setError('ไม่สามารถประเมินคำตอบได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        
        <main className="container mx-auto p-4 md:p-6">
          {/* ส่วนหัว */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#333333]">ผลการประเมินคำตอบ</h1>
              <p className="text-gray-600">
                {classInfo?.name} - คำถามรหัส: {questionId}
              </p>
            </div>
            <PrimaryButtonLink href={`/class/${classId}`}>
              กลับไปหน้ารายวิชา
            </PrimaryButtonLink>
          </div>
          
          {/* แสดงสถานะการโหลด */}
          {loading ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-700">กำลังโหลดผลการประเมิน...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h2 className="text-xl font-semibold text-red-700">เกิดข้อผิดพลาด</h2>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                >
                  ลองใหม่
                </button>
                <button
                  onClick={() => router.push(`/class/${classId}`)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                >
                  กลับไปหน้ารายวิชา
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* คอลัมน์ซ้าย - ข้อมูลการอัปโหลด */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-[#333333] mb-4">ข้อมูลการอัปโหลด</h2>
                
                {uploadInfo ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">รหัสคำถาม</p>
                      <p className="text-[#333333]">{uploadInfo.question_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">ไฟล์เฉลยจากอาจารย์</p>
                      <p className="text-[#333333]">{uploadInfo.answer_key_filename || 'ไม่มีข้อมูล'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">ไฟล์คำตอบนักเรียน</p>
                      <p className="text-[#333333]">{uploadInfo.student_answer_filename || 'ไม่มีข้อมูล'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">วันที่อัปโหลด</p>
                      <p className="text-[#333333]">
                        {new Date(uploadInfo.uploaded_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">สถานะ</p>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        uploadInfo.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        uploadInfo.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {uploadInfo.status === 'completed' ? 'ประเมินเสร็จสิ้น' : 
                         uploadInfo.status === 'failed' ? 'ประเมินล้มเหลว' :
                         uploadInfo.status === 'processing' ? 'กำลังประเมิน' : 'รอการประเมิน'}
                      </div>
                    </div>
                    
                    {/* ปุ่มดำเนินการ */}
                    <div className="flex flex-col space-y-2 pt-4">
                      <Link 
                        href={`/class/${classId}/compare/${questionId}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-center"
                      >
                        เปรียบเทียบคำตอบและเฉลย
                      </Link>
                      
                      <button
                        onClick={requestEvaluation}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                      >
                        ประเมินใหม่
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>ไม่พบข้อมูลการอัปโหลด</p>
                    <button 
                      onClick={() => router.push(`/class/${classId}/upload`)}
                      className="text-blue-600 hover:underline mt-2"
                    >
                      อัปโหลดไฟล์ใหม่
                    </button>
                  </div>
                )}
              </div>
              
              {/* คอลัมน์ขวา - ผลการประเมิน */}
              <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                <h2 className="text-xl font-semibold text-[#333333] mb-4">ผลการประเมิน</h2>
                
                {evaluationResult ? (
                  <div>
                    {/* แสดงคะแนน */}
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
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <svg className="animate-spin h-10 w-10 mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600">กำลังประเมินผล โปรดรอสักครู่...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}