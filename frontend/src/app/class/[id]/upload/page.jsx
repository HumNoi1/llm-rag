// frontend/src/app/class/[id]/upload/page.jsx
"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import ProtectedRoute from '@/components/ProtectedRoute';
import supabase from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import FileUploader from '@/components/FileUploader';

// กำหนดชื่อ bucket สำหรับเก็บไฟล์ใน Supabase Storage
const STORAGE_BUCKETS = {
  ANSWER_KEYS: 'answer-keys',
  STUDENT_ANSWERS: 'student-answer'
};

export default function UploadFilesPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id;
  const { user } = useAuth();

  // กำหนดข้อมูลรายวิชาเริ่มต้นแทนการโหลดข้อมูล
  const [classInfo] = useState({
    id: classId,
    name: 'รายวิชา',
    code: 'CODE',
  });

  // สถานะสำหรับการอัปโหลดไฟล์
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [studentAnswerFile, setStudentAnswerFile] = useState(null);
  const [questionId, setQuestionId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // จัดการเมื่อเลือกไฟล์เฉลย
  const handleAnswerKeyChange = (file, error) => {
    if (error) {
      setUploadError(error);
      return;
    }
    setAnswerKeyFile(file);
    setUploadError('');
  };

  // จัดการเมื่อเลือกไฟล์คำตอบนักเรียน
  const handleStudentAnswerChange = (file, error) => {
    if (error) {
      setUploadError(error);
      return;
    }
    setStudentAnswerFile(file);
    setUploadError('');
  };

  // จัดการเมื่อเปลี่ยนค่า ID คำถาม
  const handleQuestionIdChange = (e) => {
    // ล้างอักขระที่ไม่ควรมีใน ID
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
    setQuestionId(sanitizedValue);
  };

  // จำลองการอัปโหลดไฟล์ (ไม่ใช้ Supabase จริง)
  const uploadToStorage = async (file, bucket, folder) => {
    // จำลองการอัปโหลด
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const timestamp = new Date().getTime();
    const extension = file.name.split('.').pop().toLowerCase();
    const safeFileName = `file_${timestamp}.${extension}`;
    
    // สร้าง path ที่จะใช้เก็บข้อมูล
    const filePath = `${folder}/${safeFileName}`;
    
    console.log(`จำลองการอัปโหลดไฟล์ ${file.name} ไปยัง bucket: ${bucket}, path: ${filePath}`);
    
    // จำลองข้อมูลที่จะส่งกลับ
    return {
      path: filePath,
      publicUrl: `https://example.com/storage/${bucket}/${filePath}`,
      originalName: file.name,
      fileName: safeFileName,
      fileSize: file.size,
      fileType: file.type
    };
  };

  // ส่งฟอร์มเพื่ออัปโหลดไฟล์ทั้งหมด
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!questionId) {
      setUploadError('กรุณาระบุรหัสคำถาม');
      return;
    }

    if (!answerKeyFile || !studentAnswerFile) {
      setUploadError('กรุณาเลือกไฟล์เฉลยและไฟล์คำตอบนักเรียน');
      return;
    }
    
    if (!user) {
      setUploadError('กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      setUploadProgress(10);
      
      // กำหนดโฟลเดอร์สำหรับเก็บไฟล์
      const folderPath = `${classId}/${questionId}`;
      
      // 1. อัปโหลดไฟล์เฉลย
      setUploadStatus('กำลังอัปโหลดไฟล์เฉลย...');
      setUploadProgress(20);
      
      const answerKeyResult = await uploadToStorage(
        answerKeyFile,
        STORAGE_BUCKETS.ANSWER_KEYS,
        folderPath
      );
      
      setUploadProgress(50);
      
      // 2. อัปโหลดไฟล์คำตอบนักเรียน
      setUploadStatus('กำลังอัปโหลดไฟล์คำตอบนักเรียน...');
      
      const studentAnswerResult = await uploadToStorage(
        studentAnswerFile,
        STORAGE_BUCKETS.STUDENT_ANSWERS,
        folderPath
      );
      
      setUploadProgress(80);
      
      // 3. จำลองการบันทึกข้อมูล
      setUploadStatus('กำลังบันทึกข้อมูล...');
      
      const uploadInfo = {
        class_id: classId,
        question_id: questionId,
        answer_key_filename: answerKeyResult.originalName,
        answer_key_path: answerKeyResult.path,
        student_answer_filename: studentAnswerResult.originalName,
        student_answer_path: studentAnswerResult.path,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
        status: 'uploaded'
      };
      
      // จำลองการบันทึกข้อมูล
      console.log('ข้อมูลที่บันทึก (จำลอง):', uploadInfo);
      
      // จำลองการรอบันทึกข้อมูล
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // เสร็จสิ้นการอัปโหลด
      setUploadProgress(100);
      setUploadSuccess(true);
      setUploadStatus('อัปโหลดเสร็จสิ้น');
      
      // รีเซ็ตฟอร์ม
      setAnswerKeyFile(null);
      setStudentAnswerFile(null);
      setQuestionId('');
      
      // นำทางกลับไปยังหน้ารายวิชาหลังจากอัปโหลดสำเร็จ
      setTimeout(() => {
        router.push(`/class/${classId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        
        <main className="container mx-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#333333]">อัปโหลดไฟล์สำหรับตรวจข้อสอบ</h1>
              <p className="text-gray-600">{classInfo?.name} ({classInfo?.code})</p>
            </div>
            <PrimaryButtonLink href={`/class/${classId}`}>
              กลับไปหน้ารายวิชา
            </PrimaryButtonLink>
          </div>
          
          {uploadSuccess ? (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-green-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-[#333333]">อัปโหลดสำเร็จ</h2>
              <p className="mb-6 text-gray-600">ไฟล์ของคุณได้ถูกอัปโหลดเรียบร้อยแล้ว</p>
              <p className="mb-6 text-gray-600">กำลังนำคุณกลับไปยังหน้ารายวิชา...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
              {/* คำอธิบายการใช้งาน */}
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                <h2 className="text-lg font-semibold text-blue-700 mb-2">วิธีการอัปโหลดไฟล์</h2>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li>อัปโหลดไฟล์ PDF เฉลยจากอาจารย์</li>
                  <li>อัปโหลดไฟล์ PDF คำตอบจากนักเรียน</li>
                  <li>ระบุรหัสคำถามเพื่อใช้อ้างอิง</li>
                  <li>ระบบจะทำการบันทึกไฟล์ของคุณ</li>
                </ol>
              </div>
              
              {/* แสดงข้อความผิดพลาด */}
              {uploadError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {uploadError}
                </div>
              )}
              
              {/* รหัสคำถาม */}
              <div className="mb-4">
                <label htmlFor="questionId" className="block text-sm font-medium text-[#333333] mb-1">
                  รหัสคำถาม <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="questionId"
                  name="questionId"
                  placeholder="เช่น Q1, Q2, Question1"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium border-gray-300 focus:ring-blue-200"
                  value={questionId}
                  onChange={handleQuestionIdChange}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">รหัสนี้จะใช้อ้างอิงในการเปรียบเทียบคำตอบกับเฉลย (ใช้ตัวอักษร a-z, A-Z, ตัวเลข 0-9, และเครื่องหมาย - _ เท่านั้น)</p>
              </div>
              
              {/* อัปโหลดไฟล์เฉลยจากอาจารย์ */}
              <FileUploader
                onFileChange={handleAnswerKeyChange}
                accept=".pdf"
                fileCategory="PDF"
                fileType="PDF"
                label="ไฟล์เฉลยจากอาจารย์ (PDF)"
                required={true}
                id="answerKey"
                name="answerKey"
                maxSize="10MB"
              />
              
              {/* อัปโหลดไฟล์คำตอบนักเรียน */}
              <FileUploader
                onFileChange={handleStudentAnswerChange}
                accept=".pdf"
                fileCategory="PDF"
                fileType="PDF"
                label="ไฟล์คำตอบนักเรียน (PDF)"
                required={true}
                id="studentAnswer"
                name="studentAnswer"
                maxSize="10MB"
              />
              
              {/* แสดงความคืบหน้าการอัปโหลด */}
              {isUploading && (
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-blue-700">{uploadStatus}</span>
                    <span className="text-sm font-medium text-blue-700">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* ปุ่มอัปโหลดและยกเลิก */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push(`/class/${classId}`)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
                  disabled={isUploading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center"
                  disabled={isUploading || !answerKeyFile || !studentAnswerFile || !questionId}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังอัปโหลด...
                    </>
                  ) : 'อัปโหลดไฟล์'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}