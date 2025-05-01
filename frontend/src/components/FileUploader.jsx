"use client";

import { useState } from 'react';
import { validateFile } from '@/lib/storage-config';

/**
 * คอมโพเนนต์สำหรับอัปโหลดไฟล์
 * @param {Object} props - Props สำหรับคอมโพเนนต์
 * @param {function} props.onFileChange - ฟังก์ชันที่จะเรียกเมื่อมีการเลือกไฟล์
 * @param {string} props.accept - ประเภทไฟล์ที่รับ (e.g. ".pdf,.docx")
 * @param {string} props.fileCategory - หมวดหมู่ไฟล์สำหรับตรวจสอบ (PDF, IMAGE, DOCUMENT)
 * @param {string} props.fileType - ประเภทไฟล์สำหรับตรวจสอบขนาด (PDF, IMAGE, ATTACHMENT)
 * @param {string} props.label - ข้อความแสดงบนป้ายกำกับ
 * @param {boolean} props.required - บังคับให้เลือกไฟล์หรือไม่
 * @param {string} props.id - ID สำหรับ input
 * @param {string} props.name - ชื่อสำหรับ input
 */
export default function FileUploader({
  onFileChange,
  accept = ".pdf",
  fileCategory = "PDF",
  fileType = "PDF",
  label = "อัปโหลดไฟล์",
  required = false,
  id = "file-upload",
  name = "file",
  maxSize = "10MB"
}) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      setError("");
      onFileChange && onFileChange(null, "");
      return;
    }
    
    // ตรวจสอบไฟล์
    const validation = validateFile(selectedFile, fileCategory, fileType);
    
    if (validation.valid) {
      setFile(selectedFile);
      setError("");
      onFileChange && onFileChange(selectedFile, "");
    } else {
      setFile(null);
      setError(validation.error);
      onFileChange && onFileChange(null, validation.error);
    }
  };
  
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
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
            <p className="text-xs text-gray-500">{accept.replace(/\./g, '')} เท่านั้น (สูงสุด {maxSize})</p>
          </div>
          <input
            id={id}
            name={name}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            required={required}
          />
        </label>
      </div>
      
      {file && (
        <div className="mt-2 flex items-center text-sm text-gray-700">
          <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>{file.name}</span>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}