// frontend/src/app/class/[id]/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import supabase from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id;
  const { user } = useAuth();
  
  // สถานะสำหรับข้อมูลรายวิชา
  const [classInfo, setClassInfo] = useState(null);
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState([]);
  const [studentScores, setStudentScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // เพิ่ม state สำหรับเก็บสถานะการอนุมัติคะแนน
  const [approvedScores, setApprovedScores] = useState({});
  const [approvalLoading, setApprovalLoading] = useState({});

  // ดึงข้อมูลรายวิชาเมื่อโหลดหน้า
  useEffect(() => {
    async function fetchClassInfo() {
      try {
        if (!user) return;

        setLoading(true);
        setError('');
        
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
          
          // สร้างข้อมูลสำหรับตารางคะแนนนักเรียน
          const studentScoresList = uploadsData?.filter(upload => upload.status === 'completed' && upload.evaluation_result)
            .map(upload => ({
              id: upload.id,
              questionId: upload.question_id,
              studentName: upload.student_answer_filename?.split('.')[0] || 'ไม่ระบุชื่อ',
              fileName: upload.student_answer_filename || 'ไม่ระบุชื่อไฟล์',
              score: upload.evaluation_result.score,
              evaluatedDate: new Date(upload.updated_at || upload.uploaded_at).toLocaleDateString('th-TH'),
              answerKeyFile: upload.answer_key_filename || '-',
              uploadDate: new Date(upload.uploaded_at).toLocaleDateString('th-TH')
            })) || [];
          
          // เรียงลำดับตามคะแนน (มากไปน้อย)
          studentScoresList.sort((a, b) => b.score - a.score);
          
          setStudentScores(studentScoresList);
          
          // ตั้งค่าสถานะการอนุมัติคะแนน
          const approvals = {};
          uploadsData?.forEach(upload => {
            approvals[upload.id] = upload.is_approved || false;
          });
          setApprovedScores(approvals);
        }
      } catch (error) {
        console.error('Error fetching class info:', error);
        setError('ไม่สามารถดึงข้อมูลรายวิชาได้: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    if (classId && user) {
      fetchClassInfo();
    }
  }, [classId, user]);

  // จัดการเมื่อคลิกปุ่มดูผลการประเมิน
  const handleViewEvaluation = (questionId) => {
    router.push(`/class/${classId}/evaluation/${questionId}`);
  };
  
  // จัดการเมื่อคลิกปุ่มอนุมัติคะแนน
  const handleApproveScore = async (studentId, isApproved) => {
    // ตั้งค่า loading state สำหรับปุ่มที่กำลังกด
    setApprovalLoading(prev => ({
      ...prev,
      [studentId]: true
    }));
    
    try {
      // อัปเดตสถานะบน UI ทันที (Optimistic update)
      setApprovedScores(prev => ({
        ...prev,
        [studentId]: isApproved
      }));
      
      // ส่งข้อมูลไปบันทึกที่ฐานข้อมูล Supabase
      const { error } = await supabase
        .from('uploads')
        .update({ is_approved: isApproved })
        .eq('id', studentId);
        
      if (error) {
        throw error;
      }
      
      // แสดงข้อความสำเร็จ (อาจใช้ toast notification หรือวิธีอื่น)
      console.log('อนุมัติคะแนนสำเร็จ');
    } catch (error) {
      // ถ้าเกิดข้อผิดพลาด ให้คืนค่า state เดิม
      setApprovedScores(prev => ({
        ...prev,
        [studentId]: !isApproved
      }));
      console.error('Error approving score:', error);
      setError('ไม่สามารถอนุมัติคะแนนได้: ' + error.message);
    } finally {
      // ยกเลิก loading state
      setApprovalLoading(prev => ({
        ...prev,
        [studentId]: false
      }));
    }
  };

  // ฟังก์ชันรีเฟรชข้อมูล
  const handleRefresh = () => {
    if (classId && user) {
      setLoading(true);
      fetchClassInfo();
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />
      
      <main className="container mx-auto p-4 md:p-6">
        {/* ปุ่มรีเฟรชข้อมูล */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRefresh}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-700">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : error ? (
          // แสดงข้อความผิดพลาด
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
            <div className="mt-4 flex space-x-4">
              <button 
                onClick={handleRefresh}
                className="text-sm font-medium text-red-700 hover:underline"
              >
                ลองอีกครั้ง
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm font-medium text-red-700 hover:underline"
              >
                กลับไปหน้าแดชบอร์ด
              </button>
            </div>
          </div>
        ) : (
          // เนื้อหาหลัก
          <>
            {/* ส่วนหัวและข้อมูลรายวิชา */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#333333]">{classInfo?.name || 'ไม่มีชื่อรายวิชา'}</h1>
                  <p className="text-gray-600">{classInfo?.code || 'ไม่มีรหัสวิชา'} - ภาคเรียนที่ {classInfo?.semester || '-'}/{classInfo?.academic_year || '-'}</p>
                </div>
                <div className="flex space-x-4">
                  <PrimaryButtonLink href="/dashboard">
                    กลับไปหน้าแดชบอร์ด
                  </PrimaryButtonLink>
                </div>
              </div>
              
              {/* แสดงข้อมูลสรุป */}
              <div className="flex flex-wrap gap-4 mt-4 text-black">
                <div className="bg-blue-50 p-4 rounded-md flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ข้อสอบที่อัปโหลด</p>
                    <p className="text-lg font-semibold">{uploadedQuestions.length} ข้อ</p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-md flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ประเมินแล้ว</p>
                    <p className="text-lg font-semibold">{evaluatedAnswers.length} ข้อ</p>
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
                        : "ยังไม่มี"} / 10
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ส่วนการจัดการการตรวจข้อสอบ */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 text-black">
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
              
              <div className="mb-6 text-black">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-[#333333]">ข้อสอบที่อัปโหลดแล้ว ({uploadedQuestions.length})</h3>
                </div>
                
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
                          <tr key={question.id} className="hover:bg-gray-50">
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
                  <div className="text-center py-12 bg-gray-50 rounded-md">
                    <div className="mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">ยังไม่มีข้อสอบที่อัปโหลด</p>
                    <button
                      onClick={() => router.push(`/class/${classId}/upload`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
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
                          <tr key={answer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{answer.questionId}</td>
                            <td className="px-6 py-4">{answer.studentName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                answer.score >= 8 ? 'bg-green-100 text-green-800' : 
                                answer.score >= 5 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {answer.score}/10
                              </span>
                            </td>
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
              
              {studentScores.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-[#333333] flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      ตารางคะแนนนักเรียนทั้งหมด ({studentScores.length} คน)
                    </h3>
                    
                    {studentScores.length > 0 && (
                      <button
                        onClick={() => {
                          // อนุมัติคะแนนทั้งหมด
                          const allIds = studentScores.map(student => student.id);
                          const allApproved = allIds.every(id => approvedScores[id]);
                          
                          // ถ้าทุกรายการถูกอนุมัติแล้ว ให้ยกเลิกการอนุมัติทั้งหมด
                          // แต่ถ้ายังไม่ทั้งหมด ให้อนุมัติทั้งหมด
                          allIds.forEach(id => handleApproveScore(id, !allApproved));
                        }}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {studentScores.every(student => approvedScores[student.id]) 
                          ? "ยกเลิกการอนุมัติทั้งหมด" 
                          : "อนุมัติคะแนนทั้งหมด"}
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสคำถาม</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อนักเรียน</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อไฟล์</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คะแนน</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่อัปโหลด</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ประเมิน</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ดำเนินการ</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">อนุมัติคะแนน</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {studentScores.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{student.questionId}</td>
                            <td className="px-6 py-4">{student.studentName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.fileName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                student.score >= 8 ? 'bg-green-100 text-green-800' : 
                                student.score >= 5 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {student.score}/10
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{student.uploadDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{student.evaluatedDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => router.push(`/class/${classId}/compare/${student.questionId}?student=${student.id}`)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                ดูรายละเอียด
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleApproveScore(student.id, !approvedScores[student.id])}
                                disabled={approvalLoading[student.id]}
                                className={`p-2 rounded-full focus:outline-none transition-colors ${
                                  approvedScores[student.id] 
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                                title={approvedScores[student.id] ? "ยกเลิกการอนุมัติ" : "อนุมัติคะแนน"}
                              >
                                {approvalLoading[student.id] ? (
                                  <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                ) : approvedScores[student.id] ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* ปุ่มดาวน์โหลดคะแนนทั้งหมด (CSV) */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        // สร้างข้อมูล CSV และดาวน์โหลด
                        const headers = ['รหัสคำถาม', 'ชื่อนักเรียน', 'คะแนน', 'วันที่ประเมิน', 'สถานะการอนุมัติ'];
                        const csvData = studentScores.map(student => [
                          student.questionId,
                          student.studentName,
                          student.score,
                          student.evaluatedDate,
                          approvedScores[student.id] ? 'อนุมัติแล้ว' : 'ยังไม่อนุมัติ'
                        ]);
                        
                        // เพิ่มหัวตาราง
                        csvData.unshift(headers);
                        
                        // แปลงเป็น CSV
                        const csvContent = csvData.map(row => row.join(',')).join('\n');
                        
                        // สร้าง Blob และดาวน์โหลด
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        
                        link.setAttribute('href', url);
                        link.setAttribute('download', `คะแนน_${classInfo?.code || classId}_${new Date().toLocaleDateString('th-TH')}.csv`);
                        link.style.visibility = 'hidden';
                        
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ดาวน์โหลดคะแนนทั้งหมด (CSV)
                    </button>
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
          </>
        )}
      </main>
    </div>
  );
}