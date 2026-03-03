// frontend/src/components/EvaluationReasonModal.jsx
"use client";

import { useEffect, useRef } from 'react';

/**
 * Modal แสดงเหตุผลการให้คะแนนแบบ Structured JSON หรือ Legacy Text
 */
export default function EvaluationReasonModal({ isOpen, onClose, evaluation, studentName, score }) {
  const modalRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ตรวจสอบว่า evaluation เป็น JSON หรือไม่
  let data = null;
  if (typeof evaluation === 'object' && evaluation !== null) {
    data = evaluation;
  } else if (typeof evaluation === 'string') {
    try {
      data = JSON.parse(evaluation);
    } catch (e) {
      // ถ้าไม่ใช่ JSON ให้ใช้การแสดงผลแบบเก่า (Legacy Text)
      data = null;
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/40 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">ผลการประเมินโดย AI</h2>
              <p className="text-blue-100 text-sm">นักศึกษา: {studentName || 'ไม่ระบุชื่อ'}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-2 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 space-y-8 bg-gray-50/50">
          {data ? (
            /* Structured JSON Display */
            <>
              {/* Score Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">คะแนนรวม</span>
                  <div className="text-4xl font-black text-indigo-600">{data.total_score}<span className="text-xl text-gray-400">/40</span></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">คะแนนเฉลี่ย</span>
                  <div className="text-4xl font-black text-emerald-600">{data.normalized_score}<span className="text-xl text-gray-400">/10</span></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center md:col-span-1">
                   <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">สรุปภาพรวม</span>
                   <p className="text-sm font-medium text-gray-700">{data.evaluation_text}</p>
                </div>
              </div>

              {/* Score Details - Categorized */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                  รายละเอียดคะแนนรายหมวด
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {data.details?.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800">{item.criteria}</span>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                          {item.score} / {item.max_score || 2.0}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 italic leading-relaxed">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct & Missing Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-emerald-700 flex items-center uppercase tracking-wide">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    จุดที่ทำได้ดี
                  </h3>
                  <ul className="space-y-2">
                    {data.correct_points?.map((p, i) => (
                      <li key={i} className="text-sm bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 flex items-start">
                        <span className="mr-2">•</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-rose-700 flex items-center uppercase tracking-wide">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                    สิ่งที่ต้องปรับปรุง
                  </h3>
                  <ul className="space-y-2">
                    {data.missing_points?.map((p, i) => (
                      <li key={i} className="text-sm bg-rose-50 text-rose-800 p-3 rounded-lg border border-rose-100 flex items-start">
                        <span className="mr-2">•</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            /* Legacy Text Display fallback */
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm">
                {evaluation}
              </pre>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-md"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
