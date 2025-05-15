// frontend/src/components/EvaluationReasonModal.jsx
"use client";

import { useEffect, useRef } from 'react';

/**
 * Modal แสดงเหตุผลการให้คะแนนของ LLM
 */
export default function EvaluationReasonModal({ isOpen, onClose, evaluation, studentName, score }) {
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

  // ฟังก์ชันสำหรับแปลงข้อความให้เป็น HTML
  const formatEvaluation = (text) => {
    if (!text) return { scoreText: '', detailsHtml: '' };
    
    // แยกคะแนนออกจากรายละเอียด
    const lines = text.split('\n');
    let scoreText = '';
    let detailLines = [];
    let summaryLines = [];
    
    // หาบรรทัดที่มีคะแนน
    for (let i = 0; i < lines.length; i++) {
      // รองรับรูปแบบ คะแนน: X/10 หรือ Score: X/10
      if (lines[i].includes('คะแนน:') || lines[i].includes('Score:')) {
        scoreText = lines[i].trim();
        detailLines = lines.slice(i + 1);
        break;
      }
    }
    
    // แยกส่วนสรุป
    const summaryIndex = detailLines.findIndex(line => 
      line.includes('สรุปเหตุผลการให้คะแนน') || 
      line.includes('สรุปเหตุผล')
    );
    
    if (summaryIndex !== -1) {
      summaryLines = detailLines.slice(summaryIndex);
      detailLines = detailLines.slice(0, summaryIndex);
    }
    
    // แปลงเป็น HTML
    let detailsHtml = '';
    let currentPoint = 0;
    let inSubSection = false;
    let sectionType = ''; // คำตอบนักศึกษา, เฉลยอาจารย์, การประเมิน
    
    for (let i = 0; i < detailLines.length; i++) {
      const line = detailLines[i].trim();
      if (!line) continue; // ข้ามบรรทัดว่าง
      
      // ตรวจจับประเด็นหลัก (1., 2., 3. ฯลฯ)
      if (line.match(/^\d+\.\s/) && !line.toLowerCase().includes('ประเด็นที่')) {
        // ปิดส่วนย่อยก่อนหน้าถ้ามี
        if (inSubSection) {
          detailsHtml += '</div>';
          inSubSection = false;
        }
        
        currentPoint++;
        detailsHtml += `
          <div class="mt-4 border border-gray-200 rounded-lg overflow-hidden">
            <div class="bg-gray-50 p-2 font-medium text-gray-700 border-b border-gray-200">
              ${line}
            </div>
            <div class="p-3">
        `;
        inSubSection = true;
      }
      // ตรวจจับ "ประเด็นที่ X"
      else if (line.toLowerCase().includes('ประเด็นที่')) {
        // ปิดส่วนย่อยก่อนหน้าถ้ามี
        if (inSubSection) {
          detailsHtml += '</div>';
          inSubSection = false;
        }
        
        currentPoint++;
        detailsHtml += `
          <div class="mt-4 border border-gray-200 rounded-lg overflow-hidden">
            <div class="bg-gray-50 p-2 font-medium text-gray-700 border-b border-gray-200">
              ${line}
            </div>
            <div class="p-3">
        `;
        inSubSection = true;
      }
      // ตรวจจับ "คำตอบนักศึกษา:"
      else if (line.startsWith('คำตอบนักศึกษา:')) {
        const content = line.substring('คำตอบนักศึกษา:'.length).trim();
        detailsHtml += `
          <div class="mb-2 bg-blue-50 p-2 rounded border border-blue-100">
            <span class="font-medium text-blue-700">คำตอบนักศึกษา:</span>
            <span class="text-gray-800"> ${content}</span>
          </div>
        `;
        sectionType = 'student';
      }
      // ตรวจจับ "เฉลยอาจารย์:"
      else if (line.startsWith('เฉลยอาจารย์:')) {
        const content = line.substring('เฉลยอาจารย์:'.length).trim();
        detailsHtml += `
          <div class="mb-2 bg-green-50 p-2 rounded border border-green-100">
            <span class="font-medium text-green-700">เฉลยอาจารย์:</span>
            <span class="text-gray-800"> ${content}</span>
          </div>
        `;
        sectionType = 'solution';
      }
      // ตรวจจับ "การประเมิน:"
      else if (line.startsWith('การประเมิน:')) {
        const content = line.substring('การประเมิน:'.length).trim();
        detailsHtml += `
          <div class="mb-2 bg-purple-50 p-2 rounded border border-purple-100">
            <span class="font-medium text-purple-700">การประเมิน:</span>
            <span class="text-gray-800"> ${content}</span>
          </div>
        `;
        sectionType = 'evaluation';
      }
      // หัวข้อที่ขึ้นต้นด้วย ## (เช่น ## สรุปเหตุผลการให้คะแนน:)
      else if (line.startsWith('##')) {
        // ปิดส่วนย่อยก่อนหน้าถ้ามี
        if (inSubSection) {
          detailsHtml += '</div></div>';
          inSubSection = false;
        }
        
        const title = line.substring(2).trim();
        detailsHtml += `<h2 class="text-lg font-semibold text-gray-800 mt-6 mb-3 pb-1 border-b border-gray-200">${title}</h2>`;
      }
      // ข้อความปกติ
      else {
        detailsHtml += `<p class="my-1">${line}</p>`;
      }
    }
    
    // ปิด section ที่ยังค้างอยู่
    if (inSubSection) {
      detailsHtml += '</div></div>';
    }
    
    // เพิ่มส่วนสรุป
    if (summaryLines.length > 0) {
      detailsHtml += `
        <div class="mt-6 pt-3 border-t border-gray-200">
          <h2 class="text-lg font-semibold text-gray-800 mb-3 pb-1">สรุปเหตุผลการให้คะแนน</h2>
          <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
      `;
      
      for (const line of summaryLines) {
        if (line.trim() && !line.includes('สรุปเหตุผลการให้คะแนน')) {
          detailsHtml += `<p class="mb-2">${line}</p>`;
        }
      }
      
      detailsHtml += `</div></div>`;
    }
    
    return { scoreText, detailsHtml };
  };
  
  const { scoreText, detailsHtml } = formatEvaluation(evaluation);
  
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
            เหตุผลการให้คะแนน - {studentName || 'ไม่ระบุชื่อ'}
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
        
        {/* ส่วนแสดงคะแนน */}
        <div className="p-4 border-b flex items-center bg-gray-50/80">
          <div className={`rounded-full h-16 w-16 flex items-center justify-center mr-4 ${
            score >= 8 ? 'bg-green-100 text-green-800' : 
            score >= 5 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            <span className="text-xl font-bold">{score}/10</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-600 text-sm">ประเมินโดย AI ตามเกณฑ์การให้คะแนนวิชาแนวคิดวิศวกรรมซอฟต์แวร์</p>
          </div>
        </div>
        
        {/* ส่วนรายละเอียดการประเมิน */}
        <div className="p-6 overflow-y-auto bg-white/90">
          {detailsHtml ? (
            <div className="evaluation-details">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: detailsHtml }} />
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">การประเมินโดย AI:</h4>
                <p className="text-sm text-gray-600">ผลการประเมินนี้เปรียบเทียบคำตอบของนักศึกษากับเฉลยอย่างละเอียด</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>ไม่พบรายละเอียดการประเมิน</p>
            </div>
          )}
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