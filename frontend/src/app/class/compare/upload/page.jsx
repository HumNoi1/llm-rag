"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import supabase from '@/lib/supabase';

export default function UploadFilesPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id;

  // สถานะสำหรับข้อมูลรายวิชา
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // สถานะสำหรับการอัปโหลดไฟล์
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [studentAnswerFile, setStudentAnswerFile] = useState(null);
  const [questionId, setQuestionId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // ดึงข้อมูลรายวิชาเมื่อโหลดหน้า
  useEffect(() => {
    async function fetchClassInfo() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();

        if (error) {
          throw error;
        }

        setClassInfo(data);
      } catch (error) {
        console.error('Error fetching class info:', error);
        setUploadError('ไม่สามารถดึงข้อมูลรายวิชาได้');
      } finally {
        setLoading(false);
      }
    }

    if (classId) {
      fetchClassInfo();
    }
  }, [classId]);

  // จัดการเมื่อเลือกไฟล์เฉลย
  const handleAnswerKeyChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setAnswerKeyFile(file);
      setUploadError('');
    } else {
      setAnswerKeyFile(null);
      setUploadError('กรุณาเลือกไฟล์ PDF สำหรับเฉลย');
    }
  };

  // จัดการเมื่อเลือกไฟล์คำตอบนักเรียน
  const handleStudentAnswerChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setStudentAnswerFile(file);
      setUploadError('');
    } else {
      setStudentAnswerFile(null);
      setUploadError('กรุณาเลือกไฟล์ PDF สำหรับคำตอบนักเรียน');
    }
  };

  // จัดการเมื่อเปลี่ยนค่า ID คำถาม
  const handleQuestionIdChange = (e) => {
    setQuestionId(e.target.value);
  };

  // อัปโหลดไฟล์เฉลย
  const uploadAnswerKey = async () => {
    if (!answerKeyFile) {
      setUploadError('กรุณาเลือกไฟล์เฉลย');
      return false;
    }

    try {
      setUploadStatus('กำลังอัปโหลดไฟล์เฉลย...');
      setUploadProgress(30);
      
      // สร้าง FormData สำหรับการอัปโหลด
      const formData = new FormData();
      formData.append('file', answerKeyFile);
      formData.append('subject_id', classId);
      formData.append('question_id', questionId);

      // ส่งไฟล์ไปยัง API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/evaluation/upload-answer-key`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ไม่สามารถอัปโหลดไฟล์เฉลยได้');
      }

      setUploadProgress(60);
      setUploadStatus('อัปโหลดไฟล์เฉลยสำเร็จ');
      return true;
    } catch (error) {
      console.error('Error uploading answer key:', error);
      setUploadError(`ไม่สามารถอัปโหลดไฟล์เฉลยได้: ${error.message}`);
      return false;
    }
  };

  // อัปโหลดไฟล์คำตอบนักเรียน (จำลอง - เพื่อการพัฒนาในอนาคต)
  const uploadStudentAnswer = async () => {
    if (!studentAnswerFile) {
      setUploadError('กรุณาเลือกไฟล์คำตอบนักเรียน');
      return false;
    }

    try {
      setUploadStatus('กำลังอัปโหลดไฟล์คำตอบนักเรียน...');
      setUploadProgress(80);
      
      // จำลองการอัปโหลด (ในอนาคตจะเชื่อมต่อกับ API จริง)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadProgress(100);
      setUploadStatus('อัปโหลดไฟล์คำตอบนักเรียนสำเร็จ');
      return true;
    } catch (error) {
      console.error('Error uploading student answer:', error);
      setUploadError(`ไม่สามารถอัปโหลดไฟล์คำตอบนักเรียนได้: ${error.message}`);
      return false;
    }
  };

  // ส่งฟอร์มเพื่ออัปโหลดไฟล์ทั้งหมด
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!questionId) {
      setUploadError('กรุณาระบุรหัสคำถาม');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      setUploadProgress(10);
      
      // อัปโหลดไฟล์เฉลย
      const answerKeyUploadSuccess = await uploadAnswerKey();
      if (!answerKeyUploadSuccess) {
        throw new Error('ไม่สามารถอัปโหลดไฟล์เฉลยได้');
      }
      
      // อัปโหลดไฟล์คำตอบนักเรียน
      const studentAnswerUploadSuccess = await uploadStudentAnswer();
      if (!studentAnswerUploadSuccess) {
        throw new Error('ไม่สามารถอัปโหลดไฟล์คำตอบนักเรียนได้');
      }
      
      // บันทึกข้อมูลลงในฐานข้อมูล (Supabase)
      await saveUploadInfoToDatabase();
      
      setUploadSuccess(true);
      setUploadStatus('อัปโหลดทั้งหมดสำเร็จ');
      
      // รีเซ็ตฟอร์ม
      setAnswerKeyFile(null);
      setStudentAnswerFile(null);
      setQuestionId('');
      
      // นำทางไปยังหน้าประเมินผลหลังจากสำเร็จ
      setTimeout(() => {
        router.push(`/class/${classId}/evaluation/${questionId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // บันทึกข้อมูลการอัปโหลดลงในฐานข้อมูล
  const saveUploadInfoToDatabase = async () => {
    try {
      // บันทึกข้อมูลลงใน Supabase (จำลองการบันทึก)
      const uploadInfo = {
        class_id: classId,
        question_id: questionId,
        answer_key_filename: answerKeyFile?.name,
        student_answer_filename: studentAnswerFile?.name,
        uploaded_at: new Date().toISOString(),
      };
      
      console.log('บันทึกข้อมูลการอัปโหลด:', uploadInfo);
      
      // ในอนาคตจะเพิ่มโค้ดการบันทึกข้อมูลลง Supabase จริง
      return true;
    } catch (error) {
      console.error('Error saving upload info:', error);
      throw new Error('ไม่สามารถบันทึกข้อมูลการอัปโหลดได้');
    }
  };

  // แสดงหน้า loading
  if (loading) {
    return (
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
    );
  }

  return (
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
            <p className="mb-6 text-gray-600">กำลังนำคุณไปยังหน้าประเมินผล...</p>
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
                <li>ระบบจะทำการประเมินคำตอบโดยเปรียบเทียบกับเฉลย</li>
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
              <p className="text-xs text-gray-500 mt-1">รหัสนี้จะใช้อ้างอิงในการเปรียบเทียบคำตอบกับเฉลย</p>
            </div>
            
            {/* อัปโหลดไฟล์เฉลยจากอาจารย์ */}
            <div className="mb-4">
              <label htmlFor="answerKey" className="block text-sm font-medium text-[#333333] mb-1">
                ไฟล์เฉลยจากอาจารย์ (PDF) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวาง
                    </p>
                    <p className="text-xs text-gray-500">PDF เท่านั้น (สูงสุด 10MB)</p>
                  </div>
                  <input
                    id="answerKey"
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleAnswerKeyChange}
                    required
                  />
                </label>
              </div>
              {answerKeyFile && (
                <div className="mt-2 flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{answerKeyFile.name}</span>
                </div>
              )}
            </div>
            
            {/* อัปโหลดไฟล์คำตอบนักเรียน */}
            <div className="mb-6">
              <label htmlFor="studentAnswer" className="block text-sm font-medium text-[#333333] mb-1">
                ไฟล์คำตอบนักเรียน (PDF) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวาง
                    </p>
                    <p className="text-xs text-gray-500">PDF เท่านั้น (สูงสุด 10MB)</p>
                  </div>
                  <input
                    id="studentAnswer"
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleStudentAnswerChange}
                    required
                  />
                </label>
              </div>
              {studentAnswerFile && (
                <div className="mt-2 flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{studentAnswerFile.name}</span>
                </div>
              )}
            </div>
            
            {/* แสดงความคืบหน้าการอัปโหลด */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-blue-700">{uploadStatus}</span>
                  <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
            
            {/* ปุ่มอัปโหลดและยกเลิก */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push(`/class/${classId}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
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
                ) : 'อัปโหลดและประเมินผล'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import supabase from '@/lib/supabase';

export default function UploadFilesPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id;

  // สถานะสำหรับข้อมูลรายวิชา
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // สถานะสำหรับการอัปโหลดไฟล์
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [studentAnswerFile, setStudentAnswerFile] = useState(null);
  const [questionId, setQuestionId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // ดึงข้อมูลรายวิชาเมื่อโหลดหน้า
  useEffect(() => {
    async function fetchClassInfo() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();

        if (error) {
          throw error;
        }

        setClassInfo(data);
      } catch (error) {
        console.error('Error fetching class info:', error);
        setUploadError('ไม่สามารถดึงข้อมูลรายวิชาได้');
      } finally {
        setLoading(false);
      }
    }

    if (classId) {
      fetchClassInfo();
    }
  }, [classId]);

  // จัดการเมื่อเลือกไฟล์เฉลย
  const handleAnswerKeyChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setAnswerKeyFile(file);
      setUploadError('');
    } else {
      setAnswerKeyFile(null);
      setUploadError('กรุณาเลือกไฟล์ PDF สำหรับเฉลย');
    }
  };

  // จัดการเมื่อเลือกไฟล์คำตอบนักเรียน
  const handleStudentAnswerChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setStudentAnswerFile(file);
      setUploadError('');
    } else {
      setStudentAnswerFile(null);
      setUploadError('กรุณาเลือกไฟล์ PDF สำหรับคำตอบนักเรียน');
    }
  };

  // จัดการเมื่อเปลี่ยนค่า ID คำถาม
  const handleQuestionIdChange = (e) => {
    setQuestionId(e.target.value);
  };

  // อัปโหลดไฟล์เฉลย
  const uploadAnswerKey = async () => {
    if (!answerKeyFile) {
      setUploadError('กรุณาเลือกไฟล์เฉลย');
      return false;
    }

    try {
      setUploadStatus('กำลังอัปโหลดไฟล์เฉลย...');
      setUploadProgress(30);
      
      // สร้าง FormData สำหรับการอัปโหลด
      const formData = new FormData();
      formData.append('file', answerKeyFile);
      formData.append('subject_id', classId);
      formData.append('question_id', questionId);

      // ส่งไฟล์ไปยัง API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/evaluation/upload-answer-key`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ไม่สามารถอัปโหลดไฟล์เฉลยได้');
      }

      setUploadProgress(60);
      setUploadStatus('อัปโหลดไฟล์เฉลยสำเร็จ');
      return true;
    } catch (error) {
      console.error('Error uploading answer key:', error);
      setUploadError(`ไม่สามารถอัปโหลดไฟล์เฉลยได้: ${error.message}`);
      return false;
    }
  };

  // อัปโหลดไฟล์คำตอบนักเรียน (จำลอง - เพื่อการพัฒนาในอนาคต)
  const uploadStudentAnswer = async () => {
    if (!studentAnswerFile) {
      setUploadError('กรุณาเลือกไฟล์คำตอบนักเรียน');
      return false;
    }

    try {
      setUploadStatus('กำลังอัปโหลดไฟล์คำตอบนักเรียน...');
      setUploadProgress(80);
      
      // จำลองการอัปโหลด (ในอนาคตจะเชื่อมต่อกับ API จริง)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadProgress(100);
      setUploadStatus('อัปโหลดไฟล์คำตอบนักเรียนสำเร็จ');
      return true;
    } catch (error) {
      console.error('Error uploading student answer:', error);
      setUploadError(`ไม่สามารถอัปโหลดไฟล์คำตอบนักเรียนได้: ${error.message}`);
      return false;
    }
  };

  // ส่งฟอร์มเพื่ออัปโหลดไฟล์ทั้งหมด
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!questionId) {
      setUploadError('กรุณาระบุรหัสคำถาม');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      setUploadProgress(10);
      
      // อัปโหลดไฟล์เฉลย
      const answerKeyUploadSuccess = await uploadAnswerKey();
      if (!answerKeyUploadSuccess) {
        throw new Error('ไม่สามารถอัปโหลดไฟล์เฉลยได้');
      }
      
      // อัปโหลดไฟล์คำตอบนักเรียน
      const studentAnswerUploadSuccess = await uploadStudentAnswer();
      if (!studentAnswerUploadSuccess) {
        throw new Error('ไม่สามารถอัปโหลดไฟล์คำตอบนักเรียนได้');
      }
      
      // บันทึกข้อมูลลงในฐานข้อมูล (Supabase)
      await saveUploadInfoToDatabase();
      
      setUploadSuccess(true);
      setUploadStatus('อัปโหลดทั้งหมดสำเร็จ');
      
      // รีเซ็ตฟอร์ม
      setAnswerKeyFile(null);
      setStudentAnswerFile(null);
      setQuestionId('');
      
      // นำทางไปยังหน้าประเมินผลหลังจากสำเร็จ
      setTimeout(() => {
        router.push(`/class/${classId}/evaluation/${questionId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // บันทึกข้อมูลการอัปโหลดลงในฐานข้อมูล
  const saveUploadInfoToDatabase = async () => {
    try {
      // บันทึกข้อมูลลงใน Supabase (จำลองการบันทึก)
      const uploadInfo = {
        class_id: classId,
        question_id: questionId,
        answer_key_filename: answerKeyFile?.name,
        student_answer_filename: studentAnswerFile?.name,
        uploaded_at: new Date().toISOString(),
      };
      
      console.log('บันทึกข้อมูลการอัปโหลด:', uploadInfo);
      
      // ในอนาคตจะเพิ่มโค้ดการบันทึกข้อมูลลง Supabase จริง
      return true;
    } catch (error) {
      console.error('Error saving upload info:', error);
      throw new Error('ไม่สามารถบันทึกข้อมูลการอัปโหลดได้');
    }
  };

  // แสดงหน้า loading
  if (loading) {
    return (
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
    );
  }

  return (
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
            <p className="mb-6 text-gray-600">กำลังนำคุณไปยังหน้าประเมินผล...</p>
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
                <li>ระบบจะทำการประเมินคำตอบโดยเปรียบเทียบกับเฉลย</li>
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
              <p className="text-xs text-gray-500 mt-1">รหัสนี้จะใช้อ้างอิงในการเปรียบเทียบคำตอบกับเฉลย</p>
            </div>
            
            {/* อัปโหลดไฟล์เฉลยจากอาจารย์ */}
            <div className="mb-4">
              <label htmlFor="answerKey" className="block text-sm font-medium text-[#333333] mb-1">
                ไฟล์เฉลยจากอาจารย์ (PDF) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวาง
                    </p>
                    <p className="text-xs text-gray-500">PDF เท่านั้น (สูงสุด 10MB)</p>
                  </div>
                  <input
                    id="answerKey"
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleAnswerKeyChange}
                    required
                  />
                </label>
              </div>
              {answerKeyFile && (
                <div className="mt-2 flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{answerKeyFile.name}</span>
                </div>
              )}
            </div>
            
            {/* อัปโหลดไฟล์คำตอบนักเรียน */}
            <div className="mb-6">
              <label htmlFor="studentAnswer" className="block text-sm font-medium text-[#333333] mb-1">
                ไฟล์คำตอบนักเรียน (PDF) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวาง
                    </p>
                    <p className="text-xs text-gray-500">PDF เท่านั้น (สูงสุด 10MB)</p>
                  </div>
                  <input
                    id="studentAnswer"
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleStudentAnswerChange}
                    required
                  />
                </label>
              </div>
              {studentAnswerFile && (
                <div className="mt-2 flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{studentAnswerFile.name}</span>
                </div>
              )}
            </div>
            
            {/* แสดงความคืบหน้าการอัปโหลด */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-blue-700">{uploadStatus}</span>
                  <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
            
            {/* ปุ่มอัปโหลดและยกเลิก */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push(`/class/${classId}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
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
                ) : 'อัปโหลดและประเมินผล'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}