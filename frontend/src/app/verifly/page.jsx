// frontend/src/app/assessment/[id]/page.jsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AssessmentEvaluation({ params }) {
  const assessmentId = params.id;
  
  // สถานะต่างๆ
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [evaluationInProgress, setEvaluationInProgress] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState({});
  
  // ข้อมูลจำลอง
  const assessmentInfo = {
    id: assessmentId,
    title: 'ข้อสอบกลางภาค SOLID Principles',
    subject: 'วิศวกรรมซอฟต์แวร์',
    term: '1/2566',
    questions: [
      {
        id: 'q1',
        text: 'อธิบายหลักการ Single Responsibility Principle พร้อมยกตัวอย่าง'
      },
      {
        id: 'q2',
        text: 'อธิบายหลักการ Open-Closed Principle พร้อมยกตัวอย่าง'
      },
      {
        id: 'q3',
        text: 'อธิบายหลักการ Liskov Substitution Principle พร้อมยกตัวอย่าง'
      },
      {
        id: 'q4',
        text: 'อธิบายหลักการ Interface Segregation Principle พร้อมยกตัวอย่าง'
      },
      {
        id: 'q5',
        text: 'อธิบายหลักการ Dependency Inversion Principle พร้อมยกตัวอย่าง'
      }
    ]
  };
  
  const students = [
    { id: 1, name: 'นักศึกษา A', studentId: '6310110001', status: 'evaluated' },
    { id: 2, name: 'นักศึกษา B', studentId: '6310110002', status: 'evaluated' },
    { id: 3, name: 'นักศึกษา C', studentId: '6310110003', status: 'evaluated' },
    { id: 4, name: 'นักศึกษา D', studentId: '6310110004', status: 'pending' },
    { id: 5, name: 'นักศึกษา E', studentId: '6310110005', status: 'pending' },
  ];
  
  // ข้อมูลคำตอบและการประเมินจำลอง
  const evaluationData = {
    1: {
      answers: {
        q1: {
          text: "หลักการ Single Responsibility Principle คือหลักการที่ว่า หนึ่งคลาสควรมีหน้าที่รับผิดชอบเพียงสิ่งเดียว ถ้าคลาสมีความรับผิดชอบหลายอย่าง ควรแยกออกเป็นหลายคลาส ตัวอย่างเช่น คลาส UserService ไม่ควรมีทั้งการจัดการผู้ใช้และการส่งอีเมล ควรแยกเป็น UserService และ EmailService เพื่อให้แต่ละคลาสมีหน้าที่เฉพาะของตัวเอง",
          evaluation: {
            score: 8.5,
            feedback: "คำอธิบายหลักการ SRP ถูกต้องและชัดเจน มีการอธิบายว่าหนึ่งคลาสควรมีหน้าที่รับผิดชอบเพียงสิ่งเดียว และมีตัวอย่างที่เหมาะสมในการแยก UserService และ EmailService ออกจากกัน",
            strengths: [
              "อธิบายหลักการได้ถูกต้องและชัดเจน",
              "ยกตัวอย่างที่เหมาะสมและเข้าใจง่าย"
            ],
            weaknesses: [
              "อาจอธิบายเพิ่มเติมถึงประโยชน์ของการใช้ SRP ในการพัฒนาซอฟต์แวร์",
              "ไม่ได้อธิบายผลกระทบที่อาจเกิดขึ้นหากไม่ปฏิบัติตามหลักการ SRP"
            ]
          }
        },
        q2: {
          text: "Open-Closed Principle คือหลักการที่ว่าคลาสควรจะเปิดสำหรับการขยาย แต่ปิดสำหรับการแก้ไข หมายความว่าเราควรสามารถเพิ่มฟังก์ชันการทำงานใหม่ได้โดยไม่ต้องแก้ไขโค้ดเดิม ตัวอย่างเช่น เราสามารถใช้ interface หรือ abstract class ในการออกแบบให้รองรับการขยายในอนาคต เช่น interface PaymentProcessor ที่มีคลาสต่างๆ มาที่ implement มันเช่น CreditCardPayment, PayPalPayment โดยไม่ต้องแก้ไขตัว PaymentProcessor เมื่อต้องการเพิ่มวิธีการชำระเงินใหม่",
          evaluation: {
            score: 9.0,
            feedback: "คำอธิบายหลักการ OCP มีความถูกต้องและครอบคลุม มีการอธิบายว่าคลาสควรเปิดให้ขยาย แต่ปิดสำหรับการแก้ไข พร้อมยกตัวอย่างที่ชัดเจนเกี่ยวกับการใช้ interface หรือ abstract class เพื่อให้รองรับการขยายในอนาคต",
            strengths: [
              "อธิบายหลักการได้ละเอียดและเข้าใจง่าย",
              "ยกตัวอย่างที่เหมาะสมและเกี่ยวข้องกับการใช้งานจริง"
            ],
            weaknesses: [
              "อาจอธิบายเพิ่มเติมว่าทำไมการแก้ไขโค้ดเดิมอาจเป็นปัญหา (risk of regression)"
            ]
          }
        }
      }
    },
    2: {
      answers: {
        q1: {
          text: "Single Responsibility Principle (SRP) คือหลักการที่คลาสควรมีเหตุผลเพียงหนึ่งเดียวที่ทำให้มันเปลี่ยนแปลง หรืออีกนัยหนึ่งคือ คลาสควรมีหน้าที่รับผิดชอบเพียงอย่างเดียว ตัวอย่างเช่น ในระบบร้านค้าออนไลน์ ไม่ควรให้คลาส Order รับผิดชอบทั้งการคำนวณราคา การบันทึกลงฐานข้อมูล และการส่งอีเมลยืนยัน แต่ควรแยกเป็นคลาส OrderCalculator, OrderRepository และ OrderNotification ตามลำดับ",
          evaluation: {
            score: 9.0,
            feedback: "คำอธิบายหลักการ SRP มีความถูกต้องและครบถ้วน มีการอธิบายทั้งนิยามทางทฤษฎีและการนำไปใช้งานจริง ตัวอย่างที่ยกมาชัดเจนและแสดงให้เห็นการประยุกต์ใช้ในระบบจริง",
            strengths: [
              "อธิบายหลักการจากทั้งมุมมองของ 'เหตุผลที่ทำให้เปลี่ยนแปลง' และ 'ความรับผิดชอบเดียว'",
              "ยกตัวอย่างที่สมจริงและครอบคลุมหลายประเด็น",
              "แสดงวิธีการแก้ปัญหาที่ถูกต้องตามหลักการ SRP"
            ],
            weaknesses: [
              "อาจอธิบายเพิ่มเติมถึงประโยชน์ด้าน maintainability และ testability เมื่อใช้ SRP"
            ]
          }
        }
      }
    }
  };
  
  // จำลองการโหลดข้อมูล
  useEffect(() => {
    const loadData = async () => {
      // จำลองการดึงข้อมูลจาก API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // กำหนดนักเรียนคนแรกเป็นค่าเริ่มต้น
      setSelectedStudent(students[0]);
      
      // กำหนดสถานะการอนุมัติเริ่มต้น
      const initialApprovalStatus = {};
      students.forEach(student => {
        if (student.status === 'evaluated') {
          initialApprovalStatus[student.id] = {
            approved: false,
            reviewing: false
          };
        }
      });
      setApprovalStatus(initialApprovalStatus);
      
      setLoading(false);
    };
    
    loadData();
  }, []);
  
  // จัดการการเปลี่ยนแปลงนักเรียนที่เลือก
  const handleStudentChange = (studentId) => {
    const student = students.find(s => s.id === parseInt(studentId));
    setSelectedStudent(student);
  };
  
  // จัดการการประเมินด้วย LLM
  const handleEvaluate = async (studentId, questionId) => {
    setEvaluationInProgress(true);
    
    try {
      // จำลองการประเมินด้วย LLM
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // จำลองการอัปเดตข้อมูล (ในโค้ดจริงจะดึงจาก API)
      // ...
      
      alert(`ประเมินคำตอบของนักศึกษา ${studentId} สำหรับคำถาม ${questionId} เรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Evaluation error:', error);
      alert('เกิดข้อผิดพลาดในการประเมิน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setEvaluationInProgress(false);
    }
  };
  
  // จัดการการอนุมัติคะแนน
  const handleApprove = async (studentId, approve = true) => {
    setApprovalStatus(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reviewing: true
      }
    }));
    
    try {
      // จำลองการส่งข้อมูลไปยัง API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setApprovalStatus(prev => ({
        ...prev,
        [studentId]: {
          approved: approve,
          reviewing: false
        }
      }));
      
      alert(`${approve ? 'อนุมัติ' : 'ไม่อนุมัติ'}คะแนนของนักศึกษา ${studentId} เรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Approval error:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติ กรุณาลองใหม่อีกครั้ง');
      
      setApprovalStatus(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          reviewing: false
        }
      }));
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* พื้นที่ส่วนหัว */}
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">ระบบผู้ช่วยตรวจข้อสอบอัตนัย</h1>
          <div className="flex items-center space-x-4">
            <span>อาจารย์ มหาวิทยาลัย</span>
            <div className="bg-blue-700 p-2 rounded-full h-10 w-10 flex items-center justify-center">
              <span className="font-semibold">AM</span>
            </div>
          </div>
        </div>
      </header>

      {/* เนื้อหาหลัก */}
      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                  หน้าหลัก
                </Link>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="text-gray-500 ml-1 md:ml-2">{assessmentInfo.title}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ส่วนซ้าย - รายการนักศึกษา */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-xl font-bold mb-4">รายชื่อนักศึกษา</h2>
              <div className="space-y-2">
                {students.map((student) => (
                  <div 
                    key={student.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedStudent && selectedStudent.id === student.id
                        ? 'bg-blue-100 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleStudentChange(student.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                      </div>
                      {student.status === 'evaluated' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          approvalStatus[student.id]?.approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {approvalStatus[student.id]?.approved ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
                        </span>
                      )}
                      {student.status === 'pending' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          รอการตรวจ
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* ปุ่มดำเนินการ */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold mb-4">การดำเนินการ</h2>
              <div className="space-y-2">
                <Link 
                  href={`/assessment/${assessmentId}/upload`}
                  className="w-full block bg-blue-100 text-blue-700 p-3 rounded-md hover:bg-blue-200 transition text-center"
                >
                  อัปโหลดเฉลยและคำตอบ
                </Link>
                {selectedStudent && selectedStudent.status === 'evaluated' && !approvalStatus[selectedStudent.id]?.approved && (
                  <button 
                    className="w-full bg-green-100 text-green-700 p-3 rounded-md hover:bg-green-200 transition disabled:opacity-50"
                    onClick={() => handleApprove(selectedStudent.id, true)}
                    disabled={approvalStatus[selectedStudent.id]?.reviewing}
                  >
                    {approvalStatus[selectedStudent.id]?.reviewing ? 'กำลังอนุมัติ...' : 'อนุมัติคะแนน'}
                  </button>
                )}
                <Link 
                  href="/dashboard"
                  className="w-full block bg-gray-100 text-gray-700 p-3 rounded-md hover:bg-gray-200 transition text-center"
                >
                  กลับสู่หน้าหลัก
                </Link>
              </div>
            </div>
          </div>
          
          {/* ส่วนขวา - รายละเอียดคำตอบและการประเมิน */}
          <div className="lg:col-span-3">
            {selectedStudent ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="border-b pb-4 mb-6">
                  <h2 className="text-2xl font-bold">
                    {selectedStudent.name} <span className="text-black">({selectedStudent.studentId})</span>
                  </h2>
                  <p className="text-black">{assessmentInfo.subject} - {assessmentInfo.title}</p>
                </div>
                
                {selectedStudent.status === 'pending' ? (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-bold mb-2">รอการตรวจประเมิน</h3>
                    <p className="text-gray-600 mb-6">นักศึกษาคนนี้ยังไม่ได้รับการตรวจประเมินด้วย LLM</p>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
                      onClick={() => handleEvaluate(selectedStudent.id, 'all')}
                      disabled={evaluationInProgress}
                    >
                      {evaluationInProgress ? 'กำลังประเมิน...' : 'ประเมินทั้งหมดด้วย LLM'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {assessmentInfo.questions.map((question) => {
                      const answerData = evaluationData[selectedStudent.id]?.answers[question.id];
                      
                      if (!answerData) {
                        return (
                          <div key={question.id} className="border rounded-lg p-4">
                            <h3 className="font-bold mb-2">{question.text}</h3>
                            <p className="text-black italic">ไม่พบข้อมูลคำตอบสำหรับคำถามนี้</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={question.id} className="border rounded-lg p-6">
                          <h3 className="font-bold mb-4">{question.text}</h3>
                          
                          {/* คำตอบของนักศึกษา */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-black mb-2">คำตอบของนักศึกษา</h4>
                            <div className="bg-gray-50 p-4 rounded-md">
                              <p className="whitespace-pre-line">{answerData.text}</p>
                            </div>
                          </div>
                          
                          {/* การประเมินจาก LLM */}
                          {answerData.evaluation ? (
                            <div>
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-medium text-black">การประเมินจาก LLM</h4>
                                <div className="flex items-center">
                                  <span className="text-sm text-black mr-2">คะแนน:</span>
                                  <span className="font-bold text-lg">{answerData.evaluation.score}/10</span>
                                </div>
                              </div>
                              
                              <div className="bg-blue-50 p-4 rounded-md mb-4">
                                <p className="mb-4">{answerData.evaluation.feedback}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="font-medium text-green-700 mb-2">จุดเด่น</h5>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                      {answerData.evaluation.strengths.map((strength, index) => (
                                        <li key={index}>{strength}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h5 className="font-medium text-red-700 mb-2">จุดที่ควรปรับปรุง</h5>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                      {answerData.evaluation.weaknesses.map((weakness, index) => (
                                        <li key={index}>{weakness}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-end">
                                <button
                                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition text-sm mr-2"
                                  onClick={() => handleEvaluate(selectedStudent.id, question.id)}
                                  disabled={evaluationInProgress}
                                >
                                  ประเมินใหม่
                                </button>
                                
                                <button
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition text-sm"
                                  onClick={() => {/* เปิดหน้าต่างแก้ไขคะแนน */}}
                                >
                                  ปรับแก้คะแนน
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-black mb-2">ยังไม่มีการประเมินสำหรับคำถามนี้</p>
                              <button
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                onClick={() => handleEvaluate(selectedStudent.id, question.id)}
                                disabled={evaluationInProgress}
                              >
                                {evaluationInProgress ? 'กำลังประเมิน...' : 'ประเมินด้วย LLM'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-black">กรุณาเลือกนักศึกษาเพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}