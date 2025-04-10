"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter(); // เพิ่ม router เพื่อใช้ในการนำทาง
  
  // สร้าง state สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  // สร้าง state สำหรับการแสดงข้อความผิดพลาด
  const [errors, setErrors] = useState({});
  // สร้าง state สำหรับการแสดงสถานะการเข้าสู่ระบบ
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }

    setErrors(tempErrors);
    return formIsValid;
  };

  // ฟังก์ชันสำหรับส่งข้อมูลเข้าสู่ระบบ
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ในอนาคตจะส่งข้อมูลไปยัง API
      // const response = await fetch('/api/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });
      
      // จำลองการส่งข้อมูลสำเร็จ
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // if (!response.ok) {
      //   throw new Error('ไม่สามารถเข้าสู่ระบบได้');
      // }
      
      console.log('Login successful', formData);
      
      // เก็บข้อมูลใน localStorage เพื่อจำลองการเข้าสู่ระบบ
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify({
        name: 'อาจารย์ มหาวิทยาลัย',
        email: formData.email
      }));
      
      // นำทางไปยังหน้า Dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      
      {/* ส่วนขวา - ฟอร์มเข้าสู่ระบบ */}
      <div className="w-full md:w-3/5 p-8 flex items-center justify-center bg-[#D8EAFE]">
        <div className="max-w-md w-full">
          <div className="text-center mb-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-[#333333] mb-2">เข้าสู่ระบบ</h2>
            <p className="text-gray-600">เข้าสู่ระบบเพื่อใช้งานระบบผู้ช่วยตรวจข้อสอบอัตนัย</p>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            {/* แสดงข้อความผิดพลาดโดยรวม */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errors.submit}
              </div>
            )}
            
            {/* อีเมล */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-[#333333] mb-1">
                อีเมล
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                  errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            
            {/* รหัสผ่าน */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-[#333333] mb-1">
                รหัสผ่าน
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
            </div>
            
            {/* จดจำฉัน */}
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-[#333333]">
                จดจำฉัน
              </label>
              <Link href="/forgot-password" className="ml-auto text-sm text-blue-700 hover:text-blue-900">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            
            {/* ปุ่มเข้าสู่ระบบ */}
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
              ) : 'เข้าสู่ระบบ'}
            </button>
            
            {/* ลิงก์ไปหน้าลงทะเบียน */}
            <div className="text-center mt-4">
              <p className="text-[#333333] font-medium">
                ยังไม่มีบัญชี?{' '}
                <Link href="/register" className="text-blue-700 hover:text-blue-900 font-bold">
                  ลงทะเบียน
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}