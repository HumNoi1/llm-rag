// frontend/src/app/register/page.jsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, loading } = useAuth();
  
  // สร้าง state สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    academicPosition: '',
    acceptTerms: false
  });
  
  // สร้าง state สำหรับการแสดงข้อความผิดพลาด
  const [errors, setErrors] = useState({});
  // สร้าง state สำหรับการแสดงสถานะการลงทะเบียน
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Redirect ถ้าล็อกอินแล้ว
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  // ฟังก์ชันสำหรับรับค่าจาก input fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // ล้างข้อความผิดพลาดเมื่อผู้ใช้แก้ไขข้อมูล
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // ฟังก์ชันตรวจสอบข้อมูล
  const validateForm = () => {
    let tempErrors = {};
    let formIsValid = true;

    // ตรวจสอบชื่อ-นามสกุล
    if (!formData.fullName.trim()) {
      tempErrors.fullName = "กรุณากรอกชื่อ-นามสกุล";
      formIsValid = false;
    }

    // ตรวจสอบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      tempErrors.email = "กรุณากรอกอีเมล";
      formIsValid = false;
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
      formIsValid = false;
    }

    // ตรวจสอบรหัสผ่าน
    if (!formData.password) {
      tempErrors.password = "กรุณากรอกรหัสผ่าน";
      formIsValid = false;
    } else if (formData.password.length < 8) {
      tempErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
      formIsValid = false;
    }

    // ตรวจสอบยืนยันรหัสผ่าน
    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
      formIsValid = false;
    } else if (formData.confirmPassword !== formData.password) {
      tempErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
      formIsValid = false;
    }
    
    // ตรวจสอบตำแหน่งทางวิชาการ
    if (!formData.academicPosition) {
      tempErrors.academicPosition = "กรุณาเลือกตำแหน่งทางวิชาการ";
      formIsValid = false;
    }

    // ตรวจสอบการยอมรับเงื่อนไข
    if (!formData.acceptTerms) {
      tempErrors.acceptTerms = "กรุณายอมรับเงื่อนไขการใช้งาน";
      formIsValid = false;
    }

    setErrors(tempErrors);
    return formIsValid;
  };

  // ฟังก์ชันสำหรับส่งข้อมูลลงทะเบียน
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // สร้างข้อมูล user metadata
      const userData = {
        full_name: formData.fullName,
        academic_position: formData.academicPosition,
      };
      
      // เรียกใช้ register จาก context
      const { success, error } = await register(
        formData.email, 
        formData.password, 
        userData
      );
      
      if (!success) {
        throw error;
      }
      
      // แสดงข้อความสำเร็จ
      setSubmitSuccess(true);
      
      // รีเซ็ตฟอร์ม
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        academicPosition: '',
        acceptTerms: false
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // จัดการข้อผิดพลาดที่เฉพาะเจาะจง
      if (error.message.includes("User already registered")) {
        setErrors({ submit: 'อีเมลนี้มีผู้ใช้ลงทะเบียนแล้ว กรุณาใช้อีเมลอื่น' });
      } else if (error.message.includes("Password should be at least 6 characters")) {
        setErrors({ password: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
      } else {
        setErrors({ submit: 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ถ้ากำลังโหลดข้อมูล auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#D8EAFE]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // แสดงข้อความสำเร็จหลังจากลงทะเบียน
  if (submitSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#D8EAFE]">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-green-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-[#333333]">ลงทะเบียนสำเร็จ</h2>
          <p className="mb-6 text-gray-600">บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที</p>
          <Link
            href="/login"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#D8EAFE]">
      {/* ส่วนซ้าย - รูปภาพและข้อความ */}
      <div className="w-full md:w-2/5 bg-blue-600 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-6">ระบบผู้ช่วยตรวจข้อสอบอัตนัย</h1>
          <p className="mb-4 text-gray-100">ด้วยเทคโนโลยี AI ที่ช่วยให้การตรวจข้อสอบอัตนัยสะดวกและรวดเร็วยิ่งขึ้น</p>
          <ul className="list-disc list-inside mb-8 space-y-2">
            <li>วิเคราะห์คำตอบด้วย LLM</li>
            <li>เปรียบเทียบกับเฉลยอัตโนมัติ</li>
            <li>ให้คะแนนตามเกณฑ์ที่กำหนด</li>
            <li>บริหารจัดการชั้นเรียนและข้อสอบ</li>
          </ul>
        </div>
      </div>
      
      {/* ส่วนขวา - ฟอร์มลงทะเบียน */}
      <div className="w-full md:w-3/5 p-8 flex items-center justify-center bg-[#D8EAFE]">
        <div className="max-w-md w-full">
          <div className="text-center mb-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800">ลงทะเบียนบัญชีอาจารย์</h2>
            <p className="text-gray-600">กรอกข้อมูลเพื่อสร้างบัญชีสำหรับระบบตรวจข้อสอบอัตนัย</p>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            {/* แสดงข้อความผิดพลาดโดยรวม */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errors.submit}
              </div>
            )}
            
            {/* ชื่อ-นามสกุล */}
            <div className="mb-4">
              <label htmlFor="fullName" className="block text-sm font-medium text-[#333333] mb-1">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="เช่น ดร. สมชาย ใจดี"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                  errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>
            
            {/* อีเมล */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-[#333333] mb-1">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="example@university.ac.th"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                  errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            
            {/* ตำแหน่งทางวิชาการ */}
            <div className="mb-4">
              <label htmlFor="academicPosition" className="block text-sm font-medium text-[#333333] mb-1">
                ตำแหน่งทางวิชาการ <span className="text-red-500">*</span>
              </label>
              <select
                id="academicPosition"
                name="academicPosition"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                  errors.academicPosition ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                value={formData.academicPosition}
                onChange={handleChange}
              >
                <option value="" className="text-gray-500">-- เลือกตำแหน่ง --</option>
                <option value="อาจารย์" className="text-black">อาจารย์</option>
                <option value="ผู้ช่วยศาสตราจารย์" className="text-black">ผู้ช่วยศาสตราจารย์</option>
                <option value="รองศาสตราจารย์" className="text-black">รองศาสตราจารย์</option>
                <option value="ศาสตราจารย์" className="text-black">ศาสตราจารย์</option>
              </select>
              {errors.academicPosition && <p className="mt-1 text-sm text-red-600">{errors.academicPosition}</p>}
            </div>
            
            {/* รหัสผ่าน */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-[#333333] mb-1">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                  errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <p className="text-xs text-gray-500 mt-1">รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร</p>
            </div>
            
            {/* ยืนยันรหัสผ่าน */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#333333] mb-1">
                ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
            
            {/* เงื่อนไขการใช้งาน */}
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                  ยอมรับ <a href="#" className="text-blue-600 hover:underline">เงื่อนไขการใช้งาน</a> และ <a href="#" className="text-blue-600 hover:underline">นโยบายความเป็นส่วนตัว</a>
                </label>
              </div>
              {errors.acceptTerms && <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>}
            </div>
            
            {/* ปุ่มลงทะเบียน */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 mb-4 disabled:bg-blue-300 flex justify-center items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังดำเนินการ...
                </>
              ) : 'ลงทะเบียน'}
            </button>
            
            {/* ลิงก์ไปหน้าล็อกอิน */}
            <div className="text-center">
              <p className="text-[#333333] font-medium">
                มีบัญชีแล้ว?{' '}
                <Link href="/login" className="text-blue-700 hover:text-blue-900 font-bold">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}