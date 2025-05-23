// frontend/src/app/class/[id]/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import supabase from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import EvaluationReasonModal from '@/components/EvaluationReasonModal';

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
  
  // เพิ่ม state สำหรับ modal แสดงเหตุผลการให้คะแนน
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // เพิ่ม state สำหรับการแก้ไขคะแนน
  const [editingScores, setEditingScores] = useState({});
  const [editModeStudent, setEditModeStudent] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // สร้างฟังก์ชันสำหรับเปิดไฟล์นักเรียน
  const handleViewStudentFile = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      alert('ไม่พบ URL ไฟล์นักเรียน');
    }
  };

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
            evaluatedDate: new Date(upload.updated_at || upload.uploaded_at).toLocaleDateString('th-TH'),
            // เพิ่ม URL ไฟล์นักเรียน
            studentFileUrl: upload.student_answer_url || null
          })));
          
          // สร้างข้อมูลสำหรับตารางคะแนนนักเรียน
          const studentScoresList = uploadsData?.filter(upload => upload.status === 'completed' && upload.evaluation_result)
            .map(upload => ({
              id: upload.id,
              questionId: upload.question_id,
              studentName: upload.student_answer_filename?.split('.')[0] || 'ไม่ระบุชื่อ',
              fileName: upload.student_answer_filename || 'ไม่ระบุชื่อไฟล์',
              score: upload.evaluation_result.score,
              // เพิ่มการดึงข้อมูลเหตุผลการให้คะแนน
              evaluation: upload.evaluation_result.evaluation || 'ไม่มีข้อมูลการประเมิน',
              evaluatedDate: new Date(upload.updated_at || upload.uploaded_at).toLocaleDateString('th-TH'),
              answerKeyFile: upload.answer_key_filename || '-',
              uploadDate: new Date(upload.uploaded_at).toLocaleDateString('th-TH'),
              // เพิ่ม URL ไฟล์นักเรียน
              studentFileUrl: upload.student_answer_url || null
            })) || [];
          
          // เรียงลำดับตามคะแนน (มากไปน้อย)
          studentScoresList.sort((a, b) => b.score - a.score);
          
          setStudentScores(studentScoresList);

          // เตรียมค่าเริ่มต้นสำหรับ editingScores
          const initialEditingScores = {};
          studentScoresList.forEach(student => {
            initialEditingScores[student.id] = student.score;
          });
          setEditingScores(initialEditingScores);
          
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
  
  // จัดการเมื่อคลิกปุ่มดูเหตุผลการให้คะแนน
  const handleViewReason = (student) => {
    setSelectedEvaluation(student);
    setIsReasonModalOpen(true);
  };

  // เปิดโหมดแก้ไขคะแนน
  const handleEditScore = (studentId) => {
    setEditModeStudent(studentId);
  };

  // เปลี่ยนแปลงคะแนนด้วยปุ่ม +/-
  const handleScoreChange = (studentId, change) => {
    setEditingScores(prev => {
      // คำนวณคะแนนใหม่
      const newScore = Math.min(Math.max(prev[studentId] + change, 0), 10);
      
      return {
        ...prev,
        [studentId]: newScore
      };
    });
  };

  // จัดการเมื่อมีการเปลี่ยนแปลงคะแนนผ่าน input field
  const handleScoreInputChange = (studentId, value) => {
    const numValue = parseFloat(value);
    
    // ตรวจสอบว่าเป็นตัวเลขที่ถูกต้องและอยู่ในช่วง 0-10
    if (!isNaN(numValue)) {
      const validScore = Math.min(Math.max(numValue, 0), 10);
      
      setEditingScores(prev => ({
        ...prev,
        [studentId]: validScore
      }));
    }
  };

  // บันทึกคะแนนที่แก้ไข (ใช้ทั้งในหน้าตารางและ modal)
  const handleSaveScore = async (studentId, newScore) => {
    setSaveLoading(true);
    
    try {
      // ค้นหาข้อมูล student จาก studentId
      const student = studentScores.find(s => s.id === studentId);
      if (!student) throw new Error('ไม่พบข้อมูลนักเรียน');
      
      // ใช้คะแนนจากพารามิเตอร์ถ้ามี มิฉะนั้นใช้จาก editingScores
      const scoreToSave = newScore !== undefined ? newScore : editingScores[studentId];
      
      // สร้างข้อมูล evaluation_result ใหม่ที่จะอัปเดต
      const newEvaluationResult = {
        // คงค่าเดิมของ evaluation ไว้
        evaluation: student.evaluation,
        // อัปเดตค่า score ใหม่
        score: scoreToSave
      };
      
      // บันทึกลงฐานข้อมูล
      const { error } = await supabase
        .from('uploads')
        .update({ 
          evaluation_result: newEvaluationResult,
          updated_at: new Date().toISOString() // อัปเดตเวลาที่แก้ไข
        })
        .eq('id', studentId);
      
      if (error) throw error;
      
      // อัปเดต UI ในส่วนของ studentScores
      setStudentScores(prev => 
        prev.map(s => {
          if (s.id === studentId) {
            return { ...s, score: scoreToSave, evaluatedDate: new Date().toLocaleDateString('th-TH') };
          }
          return s;
        })
      );
      
      // อัปเดต UI ในส่วนของ evaluatedAnswers
      setEvaluatedAnswers(prev => 
        prev.map(a => {
          if (a.id === studentId) {
            return { ...a, score: scoreToSave, evaluatedDate: new Date().toLocaleDateString('th-TH') };
          }
          return a;
        })
      );
      
      // อัปเดต selectedEvaluation ถ้ามีการแก้ไขคะแนนใน modal
      if (selectedEvaluation && selectedEvaluation.id === studentId) {
        setSelectedEvaluation(prev => ({
          ...prev,
          score: scoreToSave
        }));
      }
      
      // ออกจากโหมดแก้ไขในตาราง
      setEditModeStudent(null);
      
      console.log('บันทึกคะแนนสำเร็จ');
      return true;
    } catch (error) {
      console.error('Error saving score:', error);
      setError('ไม่สามารถบันทึกคะแนนได้: ' + error.message);
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  // ยกเลิกการแก้ไขคะแนน
  const handleCancelEdit = (studentId) => {
    // ค้นหาคะแนนเดิมจาก studentScores
    const student = studentScores.find(s => s.id === studentId);
    if (student) {
      // คืนค่าคะแนนเดิม
      setEditingScores(prev => ({
        ...prev,
        [studentId]: student.score
      }));
    }
    
    // ออกจากโหมดแก้ไข
    setEditModeStudent(null);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />
      
      <main className="container mx-auto p-4 md:p-6 text-black">
        {/* Modal แสดงเหตุผลการให้คะแนน */}
        {isReasonModalOpen && selectedEvaluation && (
          <EvaluationReasonModal
            isOpen={isReasonModalOpen}
            onClose={() => setIsReasonModalOpen(false)}
            evaluation={selectedEvaluation.evaluation}
            studentName={selectedEvaluation.studentName}
            score={selectedEvaluation.score}
            studentId={selectedEvaluation.id} 
            onSaveScore={handleSaveScore} // ส่งฟังก์ชันบันทึกคะแนนไปยัง modal
          />
        )}
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
                  <li>ตรวจสอบผลการประเมิน</li>
                  <li>ปรับแก้และบันทึกคะแนนเข้าสู่ระบบ</li>
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
                                (answer.score / 40) >= 0.8 ? 'bg-green-100 text-green-800' : 
                                (answer.score / 40) >= 0.5 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {answer.score}/40
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{answer.evaluatedDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleViewStudentFile(answer.studentFileUrl)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                ดูไฟล์นักเรียน
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
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">เหตุผลการให้คะแนน</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ดำเนินการ</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">อนุมัติคะแนน</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {studentScores.map((student) => (
                          <tr key={student.id} className={`hover:bg-gray-50 ${editModeStudent === student.id ? 'bg-blue-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">{student.questionId}</td>
                            <td className="px-6 py-4">{student.studentName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.fileName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editModeStudent === student.id ? (
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => handleScoreChange(student.id, -0.5)}
                                    className="bg-red-100 hover:bg-red-200 text-red-600 w-8 h-8 rounded-full flex items-center justify-center"
                                    title="ลดคะแนน 0.5"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                  </button>
                                  
                                  <input
                                    type="number"
                                    value={editingScores[student.id] || 0}
                                    onChange={(e) => handleScoreInputChange(student.id, e.target.value)}
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                  />
                                  
                                  <button 
                                    onClick={() => handleScoreChange(student.id, 0.5)}
                                    className="bg-green-100 hover:bg-green-200 text-green-600 w-8 h-8 rounded-full flex items-center justify-center"
                                    title="เพิ่มคะแนน 0.5"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </button>
                                  
                                  <span className="text-gray-600">/10</span>
                                  
                                  <div className="ml-2 flex space-x-1">
                                    <button
                                      onClick={() => handleSaveScore(student.id)}
                                      disabled={saveLoading}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex items-center"
                                    >
                                      {saveLoading ? (
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                      ) : (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          บันทึก
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleCancelEdit(student.id)}
                                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    (student.score / 40) >= 0.8 ? 'bg-green-100 text-green-800' : 
                                    (student.score / 40) >= 0.5 ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {student.score}/40
                                  </span>
                                  <button
                                    onClick={() => handleEditScore(student.id)}
                                    className="text-gray-500 hover:text-blue-600"
                                    title="แก้ไขคะแนน"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{student.uploadDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{student.evaluatedDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleViewReason(student)}
                                className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded-md text-sm flex items-center mx-auto"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ดูเหตุผล
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleViewStudentFile(student.studentFileUrl)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                ดูไฟล์นักเรียน
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleApproveScore(student.id, !approvedScores[student.id])}
                                disabled={approvalLoading[student.id] || editModeStudent === student.id}
                                className={`p-2 rounded-full focus:outline-none transition-colors ${
                                  editModeStudent === student.id ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
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
      </main>
    </div>
  );
}