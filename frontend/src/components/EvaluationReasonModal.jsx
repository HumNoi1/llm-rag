// frontend/src/components/EvaluationDetailModal.jsx
"use client";

import { useEffect, useRef } from 'react';

/**
 * Modal แสดงรายละเอียดการประเมินแยกตามข้อพร้อมคะแนนรวม
 */
export default function EvaluationDetailModal({ isOpen, onClose, evaluation, studentName, score, questionScores = [], totalScore = 0, totalMaxScore = 0 }) {
  const modalRef = useRef(null);

  // จัดการการคลิกนอก modal เพื่อปิด modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // ฟังก์ชันสำหรับแสดงสีตามคะแนน
  const getScoreColorClass = (score, maxScore = 10) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // ฟังก์ชันสำหรับแปลงข้อความให้เป็น HTML
  const formatQuestionEvaluation = (text, questionNumber) => {
    if (!text) return '';
    
    const lines = text.split('\n');
    let html = '';
    let currentSection = '';
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      // ตรวจจับว่าเป็นส่วนคำตอบนักศึกษาหรือไม่
      if (line.startsWith('คำตอบนักศึกษา:')) {
        const content = line.substring('คำตอบนักศึกษา:'.length).trim();
        html += `
          <div class="mb-2 bg-blue-50 p-2 rounded border border-blue-100">
            <span class="font-medium text-blue-700">คำตอบนักศึกษา:</span>
            <span class="text-gray-800"> ${content}</span>
          </div>
        `;
        currentSection = 'student';
      }
      // ตรวจจับว่าเป็นส่วนเฉลยอาจารย์หรือไม่
      else if (line.startsWith('เฉลยอาจารย์:')) {
        const content = line.substring('เฉลยอาจารย์:'.length).trim();
        html += `
          <div class="mb-2 bg-green-50 p-2 rounded border border-green-100">
            <span class="font-medium text-green-700">เฉลยอาจารย์:</span>
            <span class="text-gray-800"> ${content}</span>
          </div>
        `;
        currentSection = 'solution';
      }
      // ตรวจจับว่าเป็นส่วนการประเมินหรือไม่
      else if (line.startsWith('การประเมิน:')) {
        const content = line.substring('การประเมิน:'.length).trim();
        html += `
          <div class="mb-2 bg-purple-50 p-2 rounded border border-purple-100">
            <span class="font-medium text-purple-700">การประเมิน:</span>
            <span class="text-gray-800"> ${content}</span>
          </div>
        `;
        currentSection = 'evaluation';
      }
      // ข้อความอื่นๆ
      else {
        html += `<p class="my-1">${line}</p>`;
      }
    }
    
    return html;
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30 p-4">
      <div 
        ref={modalRef}
        className="bg-white/95 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-gray-200"
      >
        {/* ส่วนหัว */}
        <div className="bg-blue-600/90 text-white p-4 flex items-center justify-between backdrop-filter backdrop-blur-sm">
          <h2 className="text-lg font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            การประเมินคำตอบ - {studentName || 'ไม่ระบุชื่อ'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* ส่วนแสดงคะแนนรวม */}
        <div className="p-4 border-b flex items-center bg-gray-50/80">
          <div className={`rounded-full h-16 w-16 flex items-center justify-center mr-4 ${
            getScoreColorClass(totalScore, totalMaxScore)
          }`}>
            <span className="text-xl font-bold">{totalScore}/{totalMaxScore}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">คะแนนรวม: {totalScore}/{totalMaxScore}</h3>
            <p className="text-gray-600 text-sm">ประเมินโดย AI ตามเกณฑ์การให้คะแนนวิชาแนวคิดวิศวกรรมซอฟต์แวร์</p>
          </div>
        </div>
        
        {/* ส่วนแสดงคะแนนแยกตามข้อ */}
        <div className="p-4 border-b bg-white/90">
          <h3 className="font-semibold text-gray-700 mb-3">คะแนนแยกตามข้อ:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {questionScores && questionScores.length > 0 ? (
              questionScores.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${getScoreColorClass(item.score)} flex flex-col items-center justify-center`}
                >
                  <span className="text-sm font-medium">ข้อที่ {item.question_number}</span>
                  <span className="text-xl font-bold">{item.score}/10</span>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-2 text-gray-500">
                ไม่พบข้อมูลคะแนนแยกตามข้อ
              </div>
            )}
          </div>
        </div>
        
        {/* ส่วนรายละเอียดการประเมินตามข้อ */}
        <div className="overflow-y-auto bg-white/90 flex-1">
          <div className="p-6">
            {questionScores && questionScores.length > 0 ? (
              <div className="space-y-6">
                {questionScores.map((item, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className={`p-3 font-medium text-white ${
                      item.score >= 8 ? 'bg-green-600' : 
                      item.score >= 5 ? 'bg-yellow-600' : 
                      'bg-red-600'
                    }`}>
                      ข้อที่ {item.question_number} - คะแนน: {item.score}/10
                    </div>
                    <div className="p-4 bg-white">
                      <div dangerouslySetInnerHTML={{ __html: formatQuestionEvaluation(item.feedback, item.question_number) }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>ไม่พบรายละเอียดการประเมินแยกตามข้อ</p>
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <div dangerouslySetInnerHTML={{ __html: evaluation || 'ไม่มีข้อมูลการประเมิน' }} />
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">การประเมินโดย AI:</h4>
              <p className="text-sm text-gray-600">ผลการประเมินนี้เปรียบเทียบคำตอบของนักศึกษากับเฉลยอย่างละเอียด แยกตามข้อคำถาม</p>
            </div>
          </div>
        </div>
        
        {/* ส่วนปุ่มด้านล่าง */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}