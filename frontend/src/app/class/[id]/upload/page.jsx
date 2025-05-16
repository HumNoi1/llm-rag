// frontend/src/app/class/[id]/upload/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import supabase from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import FileUploader from '@/components/FileUploader';
import MultipleFileUploader from '@/components/MultipleFileUploader';

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
  const [studentAnswerFiles, setStudentAnswerFiles] = useState([]); // เปลี่ยนจากไฟล์เดียวเป็นหลายไฟล์
  const [questionId, setQuestionId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // สถานะสำหรับข้อมูลไฟล์ที่อัปโหลดแล้ว
  const [answerKeyUploadInfo, setAnswerKeyUploadInfo] = useState(null);
  const [studentAnswerUploadInfos, setStudentAnswerUploadInfos] = useState([]); // เก็บข้อมูลการอัปโหลดหลายไฟล์
  
  // สถานะสำหรับผลการประเมิน
  const [evaluationResults, setEvaluationResults] = useState([]); // เก็บผลการประเมินหลายไฟล์
  const [isEvaluating, setIsEvaluating] = useState(false);

  // ดึงข้อมูลรายวิชาเมื่อโหลดหน้า (ใช้โค้ดเดิม)
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

  // อัปโหลดไฟล์ไปยัง Supabase Storage (ใช้โค้ดเดิม)
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

  // จัดการเมื่อเลือกไฟล์เฉลย (ใช้โค้ดเดิม)
  const handleAnswerKeyChange = async (file, error) => {
    if (error) {
      setUploadError(error);
      return;
    }
    
    if (file) {
      try {
        // ตรวจสอบว่ามี questionId หรือไม่
        if (!questionId) {
          setUploadError('กรุณาระบุรหัสคำถามก่อนอัปโหลดไฟล์เฉลย');
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

  // จัดการเมื่อเลือกไฟล์คำตอบนักเรียน (แก้ไขให้รองรับหลายไฟล์)
  const handleStudentAnswersChange = async (files, error) => {
    if (error) {
      setUploadError(error);
      return;
    }
    
    if (files && files.length > 0) {
      try {
        // ตรวจสอบว่ามี questionId หรือไม่
        if (!questionId) {
          setUploadError('กรุณาระบุรหัสคำถามก่อนอัปโหลดไฟล์คำตอบนักเรียน');
          return;
        }

        setStudentAnswerFiles(files);
        setUploadStatus(`เลือกไฟล์คำตอบนักเรียนแล้ว ${files.length} ไฟล์`);
      } catch (error) {
        console.error('Files selection error:', error);
        setUploadError(`เกิดข้อผิดพลาดในการเลือกไฟล์: ${error.message}`);
      }
    } else {
      setStudentAnswerFiles([]);
    }
  };

  // จัดการเมื่อเปลี่ยนค่า ID คำถาม (ใช้โค้ดเดิม)
  const handleQuestionIdChange = (e) => {
    // ล้างอักขระที่ไม่ควรมีใน ID
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
    setQuestionId(sanitizedValue);
  };

  // อัปโหลดไฟล์นักเรียนทั้งหมด
  const uploadAllStudentAnswers = async () => {
    const uploadInfos = [];
    let fileIndex = 0;
    const totalFiles = studentAnswerFiles.length;
    
    for (const file of studentAnswerFiles) {
      fileIndex++;
      setUploadStatus(`กำลังอัปโหลดไฟล์คำตอบนักเรียน ${fileIndex}/${totalFiles}...`);
      setUploadProgress(40 + (fileIndex / totalFiles) * 20); // Progress between 40-60%
      
      try {
        const result = await uploadToSupabase(
          file,
          STORAGE_BUCKETS.STUDENT_ANSWERS,
          classId,
          questionId
        );
        uploadInfos.push(result);
      } catch (error) {
        console.error(`ไม่สามารถอัปโหลดไฟล์ ${file.name}: ${error.message}`);
        throw new Error(`ไม่สามารถอัปโหลดไฟล์ ${file.name}: ${error.message}`);
      }
    }
    
    return uploadInfos;
  };

  // ประเมินคำตอบหลายไฟล์
  const evaluateAllAnswers = async (studentAnswerInfos) => {
    const results = [];
    let fileIndex = 0;
    const totalFiles = studentAnswerInfos.length;
    
    for (const studentAnswerInfo of studentAnswerInfos) {
      fileIndex++;
      setUploadStatus(`กำลังประเมินคำตอบ ${fileIndex}/${totalFiles}...`);
      setUploadProgress(60 + (fileIndex / totalFiles) * 30); // Progress between 60-90%
      
      try {
        // เตรียมข้อมูลสำหรับการประเมิน
        const evaluationRequest = {
          subject_id: classId,
          question_id: questionId,
          answer_key_url: answerKeyUploadInfo.publicUrl,
          student_answer_url: studentAnswerInfo.publicUrl,
          answer_key_path: answerKeyUploadInfo.path,
          student_answer_path: studentAnswerInfo.path,
        };

        // เรียก API ประเมินคำตอบ
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/evaluation/evaluate-from-storage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(evaluationRequest),
        });
        
        if (!response.ok) {
          throw new Error(`ไม่สามารถประเมินคำตอบไฟล์ ${studentAnswerInfo.originalName} ได้`);
        }
        
        const result = await response.json();
        results.push({
          ...result,
          studentInfo: studentAnswerInfo
        });
      } catch (error) {
        console.error(`ไม่สามารถประเมินคำตอบไฟล์ ${studentAnswerInfo.originalName}: ${error.message}`);
        // สร้างผลประเมินจำลองในกรณีที่เกิดข้อผิดพลาด
        results.push({
          evaluation: `เกิดข้อผิดพลาดในการประเมิน: ${error.message}`,
          score: 0,
          subject_id: classId,
          question_id: questionId,
          studentInfo: studentAnswerInfo,
          error: true
        });
      }
    }
    
    return results;
  };

  // บันทึกข้อมูลการอัปโหลดและผลการประเมินลงฐานข้อมูล
  const saveAllEvaluationResults = async (evaluationResults) => {
    const uploadRecords = [];
    
    for (const result of evaluationResults) {
      // เตรียมข้อมูลสำหรับบันทึก
      const uploadData = {
        class_id: classId,
        question_id: questionId,
        answer_key_filename: answerKeyUploadInfo.originalName,
        answer_key_path: answerKeyUploadInfo.path,
        answer_key_url: answerKeyUploadInfo.publicUrl,
        student_answer_filename: result.studentInfo.originalName,
        student_answer_path: result.studentInfo.path,
        student_answer_url: result.studentInfo.publicUrl,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
        status: result.error ? 'error' : 'completed',
        evaluation_result: result.error ? null : {
          score: result.score,
          evaluation: result.evaluation
        }
      };
      
      try {
        // บันทึกลงฐานข้อมูล
        const { data, error } = await supabase
          .from('uploads')
          .insert([uploadData])
          .select();
        
        if (error) {
          console.error(`ไม่สามารถบันทึกผลประเมินไฟล์ ${result.studentInfo.originalName}: ${error.message}`);
        } else {
          uploadRecords.push(data[0]);
        }
      } catch (error) {
        console.error(`ไม่สามารถบันทึกผลประเมินไฟล์ ${result.studentInfo.originalName}: ${error.message}`);
      }
    }
    
    return uploadRecords;
  };

  // ส่งฟอร์มเพื่ออัปโหลดและประเมินผล (แก้ไขให้รองรับหลายไฟล์)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!questionId) {
      setUploadError('กรุณาระบุรหัสคำถาม');
      return;
    }

    if (!answerKeyFile || studentAnswerFiles.length === 0) {
      setUploadError('กรุณาเลือกไฟล์เฉลยและไฟล์คำตอบนักเรียนอย่างน้อย 1 ไฟล์');
      return;
    }
    
    if (!user) {
      setUploadError('กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์');
      return;
    }

    try {
      setIsUploading(true);
      setIsEvaluating(true);
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
      
      // 2. อัปโหลดไฟล์คำตอบนักเรียนทั้งหมด
      setUploadStatus('กำลังอัปโหลดไฟล์คำตอบนักเรียน...');
      const studentAnswerInfos = await uploadAllStudentAnswers();
      setStudentAnswerUploadInfos(studentAnswerInfos);
      
      setUploadProgress(60);
      
      // 3. ประเมินคำตอบทั้งหมด
      setUploadStatus('กำลังประเมินผล...');
      const results = await evaluateAllAnswers(studentAnswerInfos);
      setEvaluationResults(results);
      
      setUploadProgress(90);

      // 4. บันทึกข้อมูลทั้งหมดลงฐานข้อมูล
      setUploadStatus('กำลังบันทึกข้อมูล...');
      await saveAllEvaluationResults(results);

      // เสร็จสิ้นการอัปโหลดและประเมิน
      setUploadProgress(100);
      setUploadSuccess(true);
      setUploadStatus('อัปโหลดและประเมินผลเสร็จสิ้น');
      
    } catch (error) {
      console.error('Upload and evaluation error:', error);
      setUploadError(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsUploading(false);
      setIsEvaluating(false);
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

  // แสดงสรุปผลการประเมิน
  const EvaluationResultsSummary = ({ results }) => {
    if (!results || results.length === 0) return null;
    
    // คำนวณคะแนนเฉลี่ย
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-[#333333] mb-4">สรุปผลการประเมินทั้งหมด ({results.length} ไฟล์)</h3>
        
        <div className="mb-4 flex items-center">
          <div className="bg-blue-100 rounded-full h-20 w-20 flex items-center justify-center mr-4">
            <span className="text-blue-700 text-xl font-bold">{avgScore.toFixed(1)}/10</span>
          </div>
          <div>
            <h4 className="text-md font-semibold text-[#333333]">คะแนนเฉลี่ย</h4>
            <p className="text-gray-600">จากทั้งหมด {results.length} ไฟล์</p>
          </div>
        </div>
        
        <div className="overflow-auto max-h-96 border rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อไฟล์</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คะแนน</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ดูผล</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={index} className={result.error ? "bg-red-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.studentInfo.originalName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.error ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        เกิดข้อผิดพลาด
                      </span>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (result.score / 40) >= 0.8 ? 'bg-green-100 text-green-800' : 
                        (result.score / 40) >= 0.5 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.score}/40
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    <a 
                      href={result.studentInfo.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      ดูไฟล์
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
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
          
          {uploadSuccess && evaluationResults.length > 0 ? (
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
                
                {/* แสดงข้อมูลไฟล์เฉลยที่อัปโหลดแล้ว */}
                <div className="mt-4">
                  <UploadedFileInfo
                    uploadInfo={answerKeyUploadInfo}
                    title="ไฟล์เฉลยอาจารย์"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-6">
                <EvaluationResultsSummary results={evaluationResults} />
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                  
                  {/* บล็อคขวา - อัปโหลดไฟล์คำตอบนักเรียน (หลายไฟล์) */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-[#333333] mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      คำตอบของนักศึกษา (หลายไฟล์)
                    </h2>
                    <p className="text-gray-600 mb-4">อัปโหลดไฟล์คำตอบของนักศึกษาหลายคนพร้อมกันเพื่อให้ AI ประเมินผล</p>
                    
                    {studentAnswerUploadInfos.length > 0 ? (
                      <div>
                        <h3 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          อัปโหลดไฟล์คำตอบนักศึกษาแล้ว {studentAnswerUploadInfos.length} ไฟล์
                        </h3>
                        <ul className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                          {studentAnswerUploadInfos.map((info, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
                              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <span className="truncate flex-grow">{info.originalName}</span>
                              <a 
                                href={info.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline ml-2"
                              >
                                ดู
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : studentAnswerFiles.length > 0 ? (
                      <div>
                        <h3 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          เลือกไฟล์แล้ว {studentAnswerFiles.length} ไฟล์ (รอการอัปโหลด)
                        </h3>
                        <ul className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                          {studentAnswerFiles.map((file, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
                              <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <span className="truncate">{file.name}</span>
                              <span className="ml-auto text-xs text-gray-500">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <MultipleFileUploader
                        onFilesChange={handleStudentAnswersChange}
                        accept=".pdf"
                        fileCategory="PDF"
                        fileType="PDF"
                        label="ไฟล์คำตอบนักศึกษา (PDF)"
                        required={true}
                        id="studentAnswers"
                        name="studentAnswers"
                        maxSize="10MB"
                      />
                    )}
                  </div>
                </div>
               
                {/* แสดงความคืบหน้าการอัปโหลด */}
                {(isUploading || isEvaluating) && (
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
                    disabled={isUploading || isEvaluating || !answerKeyFile || studentAnswerFiles.length === 0 || !questionId}
                  >
                    {isUploading || isEvaluating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isUploading ? 'กำลังอัปโหลด...' : 'กำลังประเมิน...'}
                      </>
                    ) : 'อัปโหลดและประเมินผล'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
  );
}