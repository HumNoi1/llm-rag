// frontend/src/app/class/[id]/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import supabase from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id;
  const { user } = useAuth();
  
  // สถานะสำหรับข้อมูลรายวิชา
  const [classInfo, setClassInfo] = useState(null);
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ดึงข้อมูลรายวิชาเมื่อโหลดหน้า
  useEffect(() => {
    async function fetchClassInfo() {
      try {
        if (!user) return;

        setLoading(true);
        
        // ดึงข้อมูลรายวิชา
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .eq('teacher_id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setClassInfo(data);
        
        // ดึงข้อมูลการอัปโหลดคำถามและคำตอบ
        const { data: uploadsData, error: uploadsError } = await supabase
          .from('uploads')
          .select('*')
          .eq('class_id', classId)
          .order('uploaded_at', { ascending: false });
          
        if (uploadsError) {
          console.error('Error fetching uploads:', uploadsError);
        } else {
          // สร้างข้อมูลคำถามที่อัปโหลดแล้ว
          const questions = {};
          
          uploadsData?.forEach(upload => {
            // กรองให้ได้คำถามที่ไม่ซ้ำกัน
            if (!questions[upload.question_id]) {
              questions[upload.question_id] = {
                id: upload.question_id,
                title: `คำถามรหัส ${upload.question_id}`,
                uploadDate: new Date(upload.uploaded_at).toLocaleDateString('th-TH'),
                status: upload.status === 'completed' ? 'evaluated' : 'pending'
              };
            }
          });
          
          setUploadedQuestions(Object.values(questions));
          
          // สร้างข้อมูลคำตอบที่ประเมินแล้ว
          const evaluatedUploads = uploadsData?.filter(upload => upload.status === 'completed' && upload.evaluation_result) || [];
          
          setEvaluatedAnswers(evaluatedUploads.map(upload => ({
            id: upload.id,
            questionId: upload.question_id,
            studentName: upload.student_answer_filename?.split('.')[0] || 'ไม่ระบุชื่อ',
            score: upload.evaluation_result.score,
            evaluatedDate: new Date(upload.updated_at || upload.uploaded_at).toLocaleDateString('th-TH')
          })));
        }
      } catch (error) {
        console.error('Error fetching class info:', error);
        setError('ไม่สามารถดึงข้อมูลรายวิชาได้');
      } finally {
        setLoading(false);
      }
    }

    if (classId) {
      fetchClassInfo();
    }
  }, [classId, user]);

  // จัดการเมื่อคลิกปุ่มดูผลการประเมิน
  const handleViewEvaluation = (questionId) => {
    router.push(`/class/${classId}/evaluation/${questionId}`);
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
          {/* ส่วนหัวและข้อมูลรายวิชา */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#333333]">{classInfo?.name}</h1>
                <p className="text-gray-600">{classInfo?.code} - ภาคเรียนที่ {classInfo?.semester}/{classInfo?.academic_year}</p>
              </div>
              <div className="flex space-x-4">
                <PrimaryButtonLink href="/dashboard">
                  กลับไปหน้าแดชบอร์ด
                </PrimaryButtonLink>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-md flex items-center">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">จำนวนนักเรียน</p>
                  <p className="text-lg font-semibold">{classInfo?.students_count || 0} คน</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md flex items-center">
                <div className="bg-green-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ข้อสอบที่อัปโหลด</p>
                  <p className="text-lg font-semibold">{uploadedQuestions.length} ข้อ</p>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-md flex items-center">
                <div className="bg-purple-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">คะแนนเฉลี่ย</p>
                  <p className="text-lg font-semibold">
                    {evaluatedAnswers.length > 0
                      ? (evaluatedAnswers.reduce((sum, answer) => sum + answer.score, 0) / evaluatedAnswers.length).toFixed(1)
                      : "ยังไม่มีผลคะแนน"} / 10
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* ส่วนการจัดการการตรวจข้อสอบ */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#333333]">การจัดการตรวจข้อสอบ</h2>
              <PrimaryButtonLink href={`/class/${classId}/upload`}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                อัปโหลดไฟล์ใหม่
              </PrimaryButtonLink>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <h3 className="font-medium text-blue-700 mb-2">ขั้นตอนการตรวจข้อสอบอัตนัย</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>อัปโหลดไฟล์เฉลยจากอาจารย์ (PDF)</li>
                <li>อัปโหลดไฟล์คำตอบของนักเรียน (PDF)</li>
                <li>รอระบบประมวลผลและประเมินคำตอบ</li>
                <li>ตรวจสอบผลการประเมินและปรับแก้คะแนนตามความเหมาะสม</li>
                <li>บันทึกคะแนนเข้าสู่ระบบ</li>
              </ol>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium text-[#333333] mb-2">ข้อสอบที่อัปโหลดแล้ว</h3>
              {uploadedQuestions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสคำถาม</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำถาม</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่อัปโหลด</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploadedQuestions.map((question) => (
                        <tr key={question.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{question.id}</td>
                          <td className="px-6 py-4">{question.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{question.uploadDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              question.status === 'evaluated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {question.status === 'evaluated' ? 'ประเมินแล้ว' : 'รอการประเมิน'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewEvaluation(question.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              ดูผลการประเมิน
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-md">
                  <p className="text-gray-500">ยังไม่มีข้อสอบที่อัปโหลด</p>
                  <button
                    onClick={() => router.push(`/class/${classId}/upload`)}
                    className="mt-2 text-blue-600 hover:text-blue-900"
                  >
                    อัปโหลดข้อสอบเลย
                  </button>
                </div>
              )}
            </div>
            
            {evaluatedAnswers.length > 0 && (
              <div>
                <h3 className="font-medium text-[#333333] mb-2">คำตอบที่ประเมินล่าสุด</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสคำถาม</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อนักเรียน</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คะแนน</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ประเมิน</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {evaluatedAnswers.map((answer) => (
                        <tr key={answer.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{answer.questionId}</td>
                          <td className="px-6 py-4">{answer.studentName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{answer.score}/10</td>
                          <td className="px-6 py-4 whitespace-nowrap">{answer.evaluatedDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => router.push(`/class/${classId}/compare/${answer.questionId}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              ดูรายละเอียด
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* ส่วนข้อมูลเพิ่มเติม */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-[#333333] mb-4">ข้อมูลเพิ่มเติม</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">คำอธิบายรายวิชา</h3>
              <p className="text-gray-600">{classInfo?.description || 'ไม่มีคำอธิบายรายวิชา'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">สถานะการสอน</h3>
                <div className="flex items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    classInfo?.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {classInfo?.is_active ? 'เปิดสอน' : 'ปิดการสอน'}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">วันที่สร้างรายวิชา</h3>
                <p className="text-gray-600">{classInfo?.created_at ? new Date(classInfo.created_at).toLocaleDateString('th-TH') : '-'}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}