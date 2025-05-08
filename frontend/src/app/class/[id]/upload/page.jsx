// frontend/src/app/class/[id]/upload/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import ProtectedRoute from '@/components/ProtectedRoute';
import supabase from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import FileUploader from '@/components/FileUploader';

// กำหนดชื่อ bucket สำหรับเก็บไฟล์
const STORAGE_BUCKETS = {
  ANSWER_KEYS: 'answer-keys',
  STUDENT_ANSWERS: 'student-answers'
};

export default function UploadFilesPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id;
  const { user } = useAuth();

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
  
  // สถานะสำหรับข้อมูลไฟล์ที่อัปโหลดแล้ว
  const [answerKeyUploadInfo, setAnswerKeyUploadInfo] = useState(null);
  const [studentAnswerUploadInfo, setStudentAnswerUploadInfo] = useState(null);
  
  // สถานะสำหรับผลการประเมิน
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // ดึงข้อมูลรายวิชาเมื่อโหลดหน้า
  useEffect(() => {
    async function fetchClassInfo() {
      try {
        if (!user || !classId) return;

        setLoading(true);
        
        // ดึงข้อมูลรายวิชา
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
      } finally {
        setLoading(false);
      }
    }

    fetchClassInfo();
  }, [classId, user]);

  // อัปโหลดไฟล์ไปยัง Supabase Storage
  const uploadToSupabase = async (file, bucketName, classId, question_id) => {
    try {
      // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
      const timestamp = new Date().getTime();
      const fileNameClean = file.name.replace(/\s+/g, '_');
      const safeFileName = `${timestamp}_${fileNameClean}`;

      // สร้างเส้นทางไฟล์ที่รวบรวมโครงสร้างโฟลเดอร์
      const filePath = `${classId}/${questionId}/${safeFileName}`;
      
      // อัปโหลดไฟล์ไปยัง Supabase
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
      
      if (error) {
        throw error;
      }
      
      // ดึง public URL ของไฟล์
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
        console.log(`อัปโหลดไฟล์ ${file.name} สำเร็จไปยัง ${bucketName}/${filePath}`, publicUrlData);
      
      // ส่งคืนข้อมูลการอัปโหลด
      return {
        path: safeFileName,
        publicUrl: publicUrlData.publicUrl,
        originalName: file.name,
        fileName: safeFileName,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ${error.message}`);
      throw error;
    }
  };

  // จัดการเมื่อเลือกไฟล์เฉลย
  const handleAnswerKeyChange = async (file, error) => {
    if (error) {
      setUploadError(error);
      return;
    }
    
    if (file) {
      try {
        // ตรวจสอบว่ามี questionId หรือไม่
        if (!questionId) {
          setUploadsError('กรุณาระบุรหัสคำถามก่อนอัปโหลดไฟล์เฉลย');
          return;
        }

        setIsUploading(true);
        setUploadError('');
        setUploadStatus('กำลังอัปโหลดไฟล์เฉลย...');

        // อัปโหลดไฟล์เฉลยไปยัง Supabase
        const answerKeyResult = await uploadToSupabase(
          file,
          STORAGE_BUCKETS.ANSWER_KEYS,
          classId,
          questionId
        );

        // บันทึกข้อมูลไฟล์ที่อัปโหลดแล้ว
        setAnswerKeyFile(file);
        setAnswerKeyUploadInfo(answerKeyResult);
        setUploadStatus('อัปโหลดไฟล์เฉลยเสร็จสิ้น');
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // จัดการเมื่อเลือกไฟล์คำตอบนักเรียน
  const handleStudentAnswerChange = async (file, error) => {
    if (error) {
      setUploadError(error);
      return;
    }
    
    if (file) {
      try {
        // ตรวจสอบว่ามี questionId หรือไม่
        if (!questionId) {
          setUploadError('กรุณาระบุรหัสคำถามก่อนอัปโหลดไฟล์คำตอบนักเรียน');
          return;
        }

        setIsUploading(true);
        setUploadError('');
        setUploadStatus('กำลังอัปโหลดไฟล์คำตอบนักเรียน...');

        // อัปโหลดไฟล์คำตอบนักเรียนไปยัง Supabase
        const studentAnswerResult = await uploadToSupabase(
          file,
          STORAGE_BUCKETS.STUDENT_ANSWERS,
          classId,
          questionId
        );

        // บันทึกข้อมูลไฟล์ที่อัปโหลดแล้ว
        setStudentAnswerFile(file);
        setStudentAnswerUploadInfo(studentAnswerResult);
        setUploadStatus('อัปโหลดไฟล์คำตอบนักเรียนเสร็จสิ้น');
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // จัดการเมื่อเปลี่ยนค่า ID คำถาม
  const handleQuestionIdChange = (e) => {
    // ล้างอักขระที่ไม่ควรมีใน ID
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
    setQuestionId(sanitizedValue);
  };

  // ประเมินคำตอบโดย API
  const evaluateAnswer = async () => {
    try {
      setIsEvaluating(true);
      setUploadError('');

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!answerKeyUploadInfo || !studentAnswerUploadInfo) {
        throw new Error('กรุณาอัปโหลดไฟล์เฉลยและคำตอบนักเรียนก่อนประเมิน');
      }
      
      // เตรียมข้อมูลสำหรับการประเมิน
      const evaluationRequest = {
        subject_id: classId,
        question_id: questionId,
        answer_key_url: answerKeyUploadInfo.publicUrl,
        student_answer_url: studentAnswerUploadInfo.publicUrl,
        answer_key_path: answerKeyUploadInfo.path,
        student_answer_path: studentAnswerUploadInfo.path,
      };

      console.log('ข้อมูลการประเมินไปยัง backend:', evaluationRequest);
      
      // เรียก API ประเมินคำตอบ
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/evaluation/evaluate-from-storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationRequest),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('ไม่สามารถประเมินคำตอบได้');
      }
      
      const result = await response.json();
      setEvaluationResult(result);
      return result;
    } catch (error) {
      // หากไม่สามารถประเมินได้จริง ใช้การจำลองผลประเมิน (สำหรับทดสอบ)
      console.error('Error evaluating answer:', error);
      setUploadError(`เกิดข้อผิดพลาดในการประเมินผล: ${error.message}`);

      // หากต้องการให้ UI ทำงานต่อได้แม้ backend จะมีปัญหา (สำหรับการทดสอบ)
      if (ProcessingInstruction.env.NODE_ENV === 'development') {
        console.warn('ใช้ผลประเมินจำลองในโหมดพัฒนา');
        const mockResult = generateMockEvaluationResult();
        setEvaluationResult(mockResult);
        return mockResult;
      }

      throw error;
    } finally {
      setIsEvaluating(false);
    }
  };

  // สร้างผลประเมินจำลอง (สำหรับทดสอบ)
  const generateMockEvaluationResult = () => {
    return {
      evaluation: `คะแนน: 8/10
      1. จุดเด่นของคำตอบ
        - อธิบายหลักการได้ครบถ้วน
        - มีการยกตัวอย่างที่ชัดเจน
        - การเรียบเรียงเนื้อหาเป็นระบบ

      2. จุดที่ขาดหรือไม่ถูกต้อง
        - ขาดการอธิบายในบางประเด็นสำคัญ
        - การอ้างอิงยังไม่ครบถ้วน

      3. ข้อเสนอแนะในการปรับปรุง
        - ควรเพิ่มการวิเคราะห์เชิงลึก
        - ควรอธิบายความเชื่อมโยงระหว่างทฤษฎีและการปฏิบัติ`,
        score: 8,
        subject_id: classId,
        question_id: questionId,
    };
  };

  // บันทึกข้อมูลการอัปโหลดลงฐานข้อมูล
  const saveUploadRecord = async (answerKeyInfo, studentAnswerInfo, evalResult) => {
    try {
      // เตรียมข้อมูลสำหรับบันทึก
      const uploadData = {
        class_id: classId,
        question_id: questionId,
        answer_key_filename: answerKeyInfo.originalName,
        answer_key_path: answerKeyInfo.path,
        answer_key_url: answerKeyInfo.publicUrl,
        student_answer_filename: studentAnswerInfo.originalName,
        student_answer_path: studentAnswerInfo.path,
        student_answer_url: studentAnswerInfo.publicUrl,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
        status: evalResult ? 'completed' : 'uploaded',
        evaluation_result: evalResult
      };
      
      // บันทึกลงฐานข้อมูล
      const { data, error } = await supabase
        .from('uploads')
        .insert([uploadData])
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('บันทึกข้อมูลการอัปโหลดสำเร็จ:', data);
      return data;
    } catch (error) {
      console.error('Error saving upload record:', error);
      throw error;
    }
  };

  // ส่งฟอร์มเพื่ออัปโหลดและประเมินผล
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
      
      // 1. อัปโหลดไฟล์เฉลย (ถ้ายังไม่ได้อัปโหลด)
      let answerKeyResult = answerKeyUploadInfo;
      if (!answerKeyUploadInfo) {
        setUploadStatus('กำลังอัปโหลดไฟล์เฉลย...');
        setUploadProgress(20);
        
        answerKeyResult = await uploadToSupabase(
          answerKeyFile,
          STORAGE_BUCKETS.ANSWER_KEYS,
          classId,
          questionId
        );
        setAnswerKeyUploadInfo(answerKeyResult);
      }
      
      setUploadProgress(40);
      
      // 2. อัปโหลดไฟล์คำตอบนักเรียน (ถ้ายังไม่ได้อัปโหลด)
      let studentAnswerResult = studentAnswerUploadInfo;
      if (!studentAnswerUploadInfo) {
        setUploadStatus('กำลังอัปโหลดไฟล์คำตอบนักเรียน...');
        
        studentAnswerResult = await uploadToSupabase(
          studentAnswerFile,
          STORAGE_BUCKETS.STUDENT_ANSWERS,
          classId,
          questionId
        );
        setStudentAnswerUploadInfo(studentAnswerResult);
      }
      
      setUploadProgress(60);
      
      // 3. ประเมินผล
      setUploadStatus('กำลังประเมินผล...');
      setUploadProgress(70);
      
      // เรียกฟังก์ชั่นประเมินผลผ่าน Backend
      const result = await evaluateAnswer();
      setUploadProgress(90);

      // 4. บันทึกข้อมูลลงฐานข้อมูล
      setUploadStatus('กำลังบันทึกข้อมูล...');
      await saveEvaluationResult(result);

      // เสร็จสิ้นการอัปโหลด
      setUploadProgress(100);
      setUploadSuccess(true);
      setUploadStatus('อัปโหลดและประเมินผลเสร็จสิ้น');
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ฟังก์ชันจำลองการประเมิน (สำหรับทดสอบ UI)
  const handleEvaluate = async () => {
    if (!answerKeyUploadInfo || !studentAnswerUploadInfo) {
      setUploadError('กรุณาอัปโหลดไฟล์คำตอบและเฉลยก่อน');
      return;
    }

    if (!questionId) {
      setUploadError('กรุณาระบุรหัสคำถาม');
      return;
    }

    try {
      setIsEvaluating(true);
      setUploadError('');

      // แสดงผลการประเมินผล
      setUploadStatus('กำลังส่งข้อมูลไปยัง backend เพื่อประเมินผล...');

      // เรียกใช้ฟังก์ชั่นประเมินผล
      const result = await evaluateAnswer();

      if (result) {
        setUploadStatus('ประเมินผลเสร็จสิ้น');

        // บันทึกข้อมูลการประเมินผลลงฐานข้อมูล
        try {
          await saveUploadRecord(result);
          console.log('บันทึกข้อมูลการประเมินผลสำเร็จ');
        } catch (saveError) {
          console.error('Error saving evaluation result:', error);
          // การประเมินยังคงสำเร็จแม้จะไม่สามารถบันทึกได้
        }
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setUploadError('เกิดข้อผิดพลาดในการประเมินผล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsEvaluating(false);
    }
  };

  const saveEvaluationResult = async () => {
    try {
      // เตรียมข้อมูลสำหรับบันทึก
      const updateData = {
        status: 'completed',
        evaluation_result: evaluationResult,
        updated_at: new Date().toISOString(),
      };

      // สร้างเงื่อนไขสำหรับการค้นหาข้อมูล
      const condition = {
        class_id: classId,
        question_id: questionId,
        answer_key_path: answerKeyUploadInfo.path,
        student_answer_path: studentAnswerUploadInfo.path,
      };

      // ตรวจสอบว่ามีบันทึกอยู่แล้วหรือไม่
      const { data: existingData, error: findError } = await supabase
        .from('uploads')
        .select('*')
        .match(condition)
        .limit(1);

      if (findError) {
        throw findError;
      }

      // ถ้ามีบันทึกอยู่แล้ว ให้อัปเดต
      if (existingData && existingData.length > 0) {
        const { error: updateError } = await supabase
          .from('uploads')
          .update(updateData)
          .eq('id', existingData[0].id);
        
        if (updateError) throw updateError;

        return { updated: true, id: existingData[0].id };
      }
      // ถ้าไม่มีบันทึก ให้สร้างใหม่
      else {
        const newRecord = {
          ...condition,
          ...updateData,
          uploaded_at: new Date().toISOString(),
          answer_key_filename: answerKeyUploadInfo.originalName,
          student_answer_filename: studentAnswerUploadInfo.originalName,
          answer_key_url: answerKeyUploadInfo.publicUrl,
          student_answer_url: studentAnswerUploadInfo.publicUrl,
        };

        const { data: insertData, error: insertError } = await supabase
          .from('uploads')
          .insert([newRecord])
          .select();
        
        if (insertError) throw insertError;

        return { inserted: true, id: insertData[0].id };
      }
    } catch (error) {
      console.error('Error saving evaluation result:', error);
      throw error;
    }
  };

  // ฟังก์ชันบันทึกและย้ายไปหน้าถัดไป
  const handleSaveAndContinue = () => {
    router.push(`/class/${classId}`);
  };

  // Component สำหรับแสดงข้อมูลไฟล์ที่อัปโหลดแล้ว
  const UploadedFileInfo = ({ uploadInfo, title, icon }) => {
    if (!uploadInfo) return null;
    
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
          {icon || (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {title} - อัปโหลดเรียบร้อยแล้ว
        </h4>
        <div className="space-y-1">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <span className="font-medium">ชื่อไฟล์:</span> {uploadInfo.originalName}
          </p>
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="font-medium">ขนาด:</span> {(uploadInfo.fileSize / (1024 * 1024)).toFixed(2)} MB
          </p>
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="font-medium">อัปโหลดเมื่อ:</span> {new Date(uploadInfo.uploadedAt).toLocaleString('th-TH')}
          </p>
          
          {/* ลิงก์ดูไฟล์ */}
          <div className="mt-2">
            <a 
              href={uploadInfo.publicUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              ดูไฟล์
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        
        <main className="container mx-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#333333]">อัปโหลดและประเมินคำตอบ</h1>
              <p className="text-gray-600">
                {loading ? 'กำลังโหลดข้อมูล...' : `${classInfo?.name || 'รายวิชา'} (${classInfo?.code || '-'})`}
              </p>
            </div>
            <PrimaryButtonLink href={`/class/${classId}`}>
              กลับไปหน้ารายวิชา
            </PrimaryButtonLink>
          </div>
          
          {uploadSuccess && evaluationResult ? (
            <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-md">
              <div className="text-center mb-6">
                <div className="text-green-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-[#333333]">อัปโหลดและประเมินสำเร็จ</h2>
                <p className="mb-2 text-gray-600">ไฟล์ของคุณได้ถูกอัปโหลดและประเมินผลเรียบร้อยแล้ว</p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-blue-700 mb-4">ข้อมูลการอัปโหลด</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">รหัสคำถาม</p>
                    <p className="text-gray-700 font-medium">{questionId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">วันที่อัปโหลด</p>
                    <p className="text-gray-700 font-medium">{new Date().toLocaleDateString('th-TH', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</p>
                  </div>
                </div>
                
                {/* แสดงข้อมูลไฟล์ที่อัปโหลดแล้ว */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UploadedFileInfo
                    uploadInfo={answerKeyUploadInfo}
                    title="ไฟล์เฉลยอาจารย์"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                  
                  <UploadedFileInfo
                    uploadInfo={studentAnswerUploadInfo}
                    title="ไฟล์คำตอบนักศึกษา"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-6">
                <h3 className="text-lg font-semibold text-[#333333] mb-4">ผลการประเมินโดย AI</h3>
                <div className="mb-4 flex items-center">
                  <div className="bg-blue-100 rounded-full h-24 w-24 flex items-center justify-center mr-4">
                    <span className="text-blue-700 text-2xl font-bold">{evaluationResult.score}/10</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#333333]">คะแนนที่ประเมิน</h4>
                    <p className="text-gray-600">ประเมินโดย AI</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line border border-gray-200">
                  {evaluationResult.evaluation}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSaveAndContinue}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  บันทึกและกลับไปหน้ารายวิชา
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <form onSubmit={handleSubmit}>
                {/* แสดงข้อความผิดพลาด */}
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {uploadError}
                  </div>
                )}
                
                {/* ส่วนรหัสคำถาม */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h2 className="text-xl font-semibold text-[#333333] mb-4">ข้อมูลคำถาม</h2>
                  <div>
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
                </div>
                
                {/* 3 บล็อคหลัก */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* บล็อคซ้าย - อัปโหลดไฟล์เฉลยอาจารย์ */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      เฉลยของอาจารย์
                    </h2>
                    <p className="text-gray-600 mb-4">อัปโหลดไฟล์เฉลยของอาจารย์ เพื่อใช้ในการเปรียบเทียบกับคำตอบของนักศึกษา</p>
                    
                    {answerKeyUploadInfo ? (
                      <UploadedFileInfo 
                        uploadInfo={answerKeyUploadInfo} 
                        title="ไฟล์เฉลยอาจารย์" 
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      />
                    ) : (
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
                    )}
                  </div>
                  
                  {/* บล็อคกลาง - การประเมินผล */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      การประเมินผลโดย AI
                    </h2>
                    <p className="text-gray-600 mb-4">AI จะเปรียบเทียบคำตอบของนักศึกษากับเฉลยของอาจารย์</p>
                    
                    {isEvaluating ? (
                      <div className="py-8 flex flex-col items-center justify-center">
                        <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-700">กำลังประเมินผล...</p>
                      </div>
                    ) : evaluationResult ? (
                      <div>
                        <div className="flex items-center mb-4">
                          <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mr-3">
                            <span className="text-blue-700 text-xl font-bold">{evaluationResult.score}/10</span>
                          </div>
                          <p className="text-gray-700">คะแนนจาก AI</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto text-sm">
                          <p className="whitespace-pre-line">{evaluationResult.evaluation}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleEvaluate}
                          disabled={!answerKeyUploadInfo || !studentAnswerUploadInfo || !questionId}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:bg-purple-300 disabled:cursor-not-allowed"
                        >
                          ประเมินผล
                        </button>
                        {(!answerKeyUploadInfo || !studentAnswerUploadInfo) && (
                          <p className="text-sm text-gray-500 mt-2">กรุณาอัปโหลดไฟล์ทั้งสองก่อนประเมินผล</p>
                        )}
                        {!questionId && (
                          <p className="text-sm text-gray-500 mt-2">กรุณาระบุรหัสคำถามก่อนประเมินผล</p>
                        )}
                      </div>
                    )}
                  </div>
                 
                  {/* บล็อคขวา - อัปโหลดไฟล์คำตอบนักเรียน */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      คำตอบของนักศึกษา
                    </h2>
                    <p className="text-gray-600 mb-4">อัปโหลดไฟล์คำตอบของนักศึกษาเพื่อให้ AI ประเมินผล</p>
                    
                    {studentAnswerUploadInfo ? (
                      <UploadedFileInfo 
                        uploadInfo={studentAnswerUploadInfo} 
                        title="ไฟล์คำตอบนักศึกษา" 
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      />
                    ) : (
                      <FileUploader
                        onFileChange={handleStudentAnswerChange}
                        accept=".pdf"
                        fileCategory="PDF"
                        fileType="PDF"
                        label="ไฟล์คำตอบนักศึกษา (PDF)"
                        required={true}
                        id="studentAnswer"
                        name="studentAnswer"
                        maxSize="10MB"
                      />
                    )}
                  </div>
                </div>
               
                {/* แสดงความคืบหน้าการอัปโหลด */}
                {isUploading && (
                  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
                
                {/* ปุ่มดำเนินการ */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/class/${classId}`)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
                    disabled={isUploading || isEvaluating}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center"
                    disabled={isUploading || isEvaluating || !answerKeyFile || !studentAnswerFile || !questionId}
                  >
                    {isUploading || isEvaluating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isUploading ? 'กำลังอัปโหลด...' : 'กำลังประเมิน...'}
                      </>
                    ) : 'ประเมินผล'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}