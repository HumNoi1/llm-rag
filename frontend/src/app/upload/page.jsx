// frontend/src/app/assessment/[id]/upload/page.jsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UploadAnswers({ params }) {
  const router = useRouter();
  const assessmentId = params.id;
  
  // สถานะของฟอร์ม
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [studentAnswerFiles, setStudentAnswerFiles] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ success: false, message: '' });
  
  // ข้อมูลจำลองสำหรับตัวอย่าง
  const assessmentInfo = {
    id: assessmentId,
    title: 'ข้อสอบกลางภาค SOLID Principles',
    subject: 'วิศวกรรมซอฟต์แวร์',
    term: '1/2566',
    description: 'อธิบายหลักการ SOLID ในการออกแบบซอฟต์แวร์เชิงวัตถุ พร้อมยกตัวอย่างประกอบ'
  };
  
  // จัดการการเปลี่ยนแปลงของการอัปโหลดไฟล์เฉลย
  const handleAnswerKeyChange = (e) => {
    const file = e.target.files[0];
    setAnswerKeyFile(file);
  };
  
  // จัดการการเปลี่ยนแปลงของการอัปโหลดไฟล์คำตอบนักเรียน
  const handleStudentAnswersChange = (e) => {
    const files = e.target.files;
    setStudentAnswerFiles(files);
  };
  
  // จัดการการส่งฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบว่ามีไฟล์ที่เลือกหรือไม่
    if (!answerKeyFile) {
      setUploadStatus({
        success: false,
        message: 'กรุณาเลือกไฟล์เฉลยก่อนดำเนินการ'
      });
      return;
    }
    
    if (!studentAnswerFiles || studentAnswerFiles.length === 0) {
      setUploadStatus({
        success: false,
        message: 'กรุณาเลือกไฟล์คำตอบของนักเรียนก่อนดำเนินการ'
      });
      return;
    }
    
    // เริ่มอัปโหลด
    setUploading(true);
    
    try {
      // ในสถานการณ์จริงจะส่งข้อมูลไปยัง API
      // จำลองการอัปโหลด
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadStatus({
        success: true,
        message: 'อัปโหลดไฟล์เฉลยและคำตอบนักเรียนสำเร็จ'
      });
      
      // หลังจากอัปโหลดสำเร็จให้รอ 1.5 วินาทีแล้วนำผู้ใช้ไปหน้าตรวจข้อสอบ
      setTimeout(() => {
        router.push(`/assessment/${assessmentId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง'
      });
    } finally {
      setUploading(false);
    }
  };
  
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
              <li>
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <Link href={`/assessment/${assessmentId}`} className="text-gray-700 hover:text-blue-600 ml-1 md:ml-2">
                    {assessmentInfo.title}
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="text-gray-500 ml-1 md:ml-2">อัปโหลดเฉลยและคำตอบ</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">{assessmentInfo.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600"><span className="font-medium">วิชา:</span> {assessmentInfo.subject}</p>
              <p className="text-gray-600"><span className="font-medium">ภาคเรียน:</span> {assessmentInfo.term}</p>
            </div>
            <div>
              <p className="text-gray-600"><span className="font-medium">คำอธิบาย:</span> {assessmentInfo.description}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* อัปโหลดไฟล์เฉลย */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">อัปโหลดไฟล์เฉลย</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="flex flex-col items-center justify-center">
                  {!answerKeyFile ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-500 mb-2">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                      <p className="text-gray-400 text-sm">รองรับไฟล์ .pdf, .doc, .docx, .txt</p>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-700 mb-1">ไฟล์เฉลยพร้อมแล้ว</p>
                      <p className="text-gray-500 text-sm">{answerKeyFile.name} ({Math.round(answerKeyFile.size / 1024)} KB)</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    id="answerKey" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleAnswerKeyChange}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('answerKey').click()}
                    className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition"
                  >
                    {answerKeyFile ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* อัปโหลดไฟล์คำตอบนักเรียน */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">อัปโหลดไฟล์คำตอบนักเรียน</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="flex flex-col items-center justify-center">
                  {!studentAnswerFiles || studentAnswerFiles.length === 0 ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-500 mb-2">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                      <p className="text-gray-400 text-sm">รองรับไฟล์ .pdf, .doc, .docx, .txt (อัปโหลดได้หลายไฟล์)</p>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-700 mb-1">ไฟล์คำตอบนักเรียนพร้อมแล้ว</p>
                      <p className="text-gray-500 text-sm">เลือกไฟล์ {studentAnswerFiles.length} ไฟล์</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    id="studentAnswers" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    onChange={handleStudentAnswersChange}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('studentAnswers').click()}
                    className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition"
                  >
                    {studentAnswerFiles && studentAnswerFiles.length > 0 ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* ส่วนแสดงสถานะการอัปโหลด */}
            {uploadStatus.message && (
              <div className={`mb-6 p-4 rounded-md ${uploadStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {uploadStatus.message}
              </div>
            )}
            
            {/* ปุ่มดำเนินการ */}
            <div className="flex justify-end">
              <Link 
                href={`/assessment/${assessmentId}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition mr-3"
              >
                ยกเลิก
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
                disabled={uploading}
              >
                {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดและดำเนินการต่อ'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}