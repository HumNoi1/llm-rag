"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { PrimaryButtonLink } from '@/components/ui/NavLink';
import supabase from '@/lib/supabase';

export default function CreateClassPage() {
  const router = useRouter();
  
  // สร้าง state สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: '',
    year: '',
    description: '',
    isActive: true
  });
  
  // สร้าง state สำหรับการแสดงข้อความผิดพลาด
  const [errors, setErrors] = useState({});
  // สร้าง state สำหรับการแสดงสถานะการบันทึก
  const [isSubmitting, setIsSubmitting] = useState(false);
  // สร้าง state สำหรับการแสดงผลสำเร็จ
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

    // ตรวจสอบชื่อวิชา
    if (!formData.name.trim()) {
      tempErrors.name = "กรุณากรอกชื่อวิชา";
      formIsValid = false;
    }

    // ตรวจสอบรหัสวิชา
    if (!formData.code.trim()) {
      tempErrors.code = "กรุณากรอกรหัสวิชา";
      formIsValid = false;
    }

    // ตรวจสอบภาคเรียน
    if (!formData.semester) {
      tempErrors.semester = "กรุณาเลือกภาคเรียน";
      formIsValid = false;
    }

    // ตรวจสอบปีการศึกษา
    if (!formData.year) {
      tempErrors.year = "กรุณาเลือกปีการศึกษา";
      formIsValid = false;
    }

    setErrors(tempErrors);
    return formIsValid;
  };

  // ฟังก์ชันสำหรับส่งข้อมูลบันทึกรายวิชา
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนสร้างรายวิชา');
      }
      
      const teacherId = session.user.id;
      
      // สร้างข้อมูลรายวิชาที่จะบันทึกลง Supabase
      const classData = {
        name: formData.name,
        code: formData.code,
        semester: formData.semester,
        academic_year: formData.year,
        description: formData.description || null,
        is_active: formData.isActive,
        students_count: 0, // เริ่มต้นยังไม่มีนักเรียน
        created_at: new Date().toISOString(),
        teacher_id: teacherId
      };
      
      // บันทึกข้อมูลลงในตาราง classes
      const { data, error } = await supabase
        .from('classes')
        .insert([classData])
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('บันทึกรายวิชาสำเร็จ:', data);
      
      // แสดงข้อความสำเร็จ
      setSubmitSuccess(true);
      
      // นำทางไปยังหน้า Dashboard หลังจาก 2 วินาที
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating class:', error);
      setErrors({ submit: `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message || 'กรุณาลองใหม่อีกครั้ง'}` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // สร้างตัวเลือกปีการศึกษา
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear() + 543; // แปลงเป็น พ.ศ.
    const yearOptions = [];
    
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      yearOptions.push(
        <option key={year} value={year}>{year}</option>
      );
    }
    
    return yearOptions;
  };

  // แสดงข้อความสำเร็จหลังจากบันทึก
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        <main className="container mx-auto p-4 md:p-6">
          <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-green-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#333333]">บันทึกรายวิชาสำเร็จ</h2>
            <p className="mb-6 text-gray-600">รายวิชาของคุณได้ถูกบันทึกเรียบร้อยแล้ว</p>
            <p className="mb-6 text-gray-600">กำลังนำคุณกลับไปยังหน้าแดชบอร์ด...</p>
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
          <h1 className="text-2xl font-bold text-[#333333]">เพิ่มรายวิชาใหม่</h1>
          <PrimaryButtonLink href="/dashboard">
            กลับไปหน้าแดชบอร์ด
          </PrimaryButtonLink>
        </div>
        
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
          {/* แสดงข้อความผิดพลาดโดยรวม */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}
          
          {/* ชื่อวิชา */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-[#333333] mb-1">
              ชื่อวิชา <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="เช่น วิศวกรรมซอฟต์แวร์"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          {/* รหัสวิชา */}
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-[#333333] mb-1">
              รหัสวิชา <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              placeholder="เช่น CS101"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                errors.code ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              value={formData.code}
              onChange={handleChange}
            />
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
          </div>
          
          {/* ภาคเรียนและปีการศึกษา */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-[#333333] mb-1">
                ภาคเรียน <span className="text-red-500">*</span>
              </label>
              <select
                id="semester"
                name="semester"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                  errors.semester ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                value={formData.semester}
                onChange={handleChange}
              >
                <option value="">-- เลือกภาคเรียน --</option>
                <option value="1">ภาคเรียนที่ 1</option>
                <option value="2">ภาคเรียนที่ 2</option>
                <option value="3">Summer</option>
              </select>
              {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester}</p>}
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-[#333333] mb-1">
                ปีการศึกษา <span className="text-red-500">*</span>
              </label>
              <select
                id="year"
                name="year"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black font-medium ${
                  errors.year ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                value={formData.year}
                onChange={handleChange}
              >
                <option value="">-- เลือกปีการศึกษา --</option>
                {generateYearOptions()}
              </select>
              {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
            </div>
          </div>
          
          {/* คำอธิบายรายวิชา */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-[#333333] mb-1">
              คำอธิบายรายวิชา
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="รายละเอียดเกี่ยวกับรายวิชา"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-200 text-black font-medium"
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>
          
          {/* สถานะการเปิดใช้งาน */}
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-[#333333]">
                เปิดใช้งานรายวิชานี้
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">เมื่อเปิดใช้งาน รายวิชานี้จะแสดงในหน้าแดชบอร์ดและสามารถเข้าถึงได้</p>
          </div>
          
          {/* ปุ่มบันทึกและยกเลิก */}
          <div className="flex justify-end space-x-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังบันทึก...
                </>
              ) : 'บันทึกรายวิชา'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}