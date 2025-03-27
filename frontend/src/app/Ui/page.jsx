// frontend/src/app/dashboard/page.jsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Dashboard() {
  // ข้อมูลจำลองสำหรับการแสดงผล
  const [classes, setClasses] = useState([
    { id: 1, name: 'วิศวกรรมซอฟต์แวร์', code: 'SW101', term: '1/2566', students: 45 },
    { id: 2, name: 'การวิเคราะห์และออกแบบเชิงวัตถุ', code: 'SW201', term: '1/2566', students: 38 },
    { id: 3, name: 'การพัฒนาเว็บแอปพลิเคชัน', code: 'SW301', term: '1/2566', students: 42 },
  ]);

  // จำลองการดึงข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    // ในอนาคตจะดึงข้อมูลจริงจาก API
    console.log('โหลดข้อมูลแดชบอร์ด');
  }, []);

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
        {/* ส่วนข้อมูลสรุป */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">ข้อมูลรายวิชา</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-black">{classes.length}</p>
                <p className="text-black">วิชาที่สอนทั้งหมด</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">นักเรียนทั้งหมด</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-black">125</p>
                <p className="text-gray-600 text-black">คนที่ลงทะเบียนทั้งหมด</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">งานที่ต้องตรวจ</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-black">28</p>
                <p className="text-gray-600">ข้อสอบที่รอการตรวจ</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนคลาสเรียน */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-black">รายวิชาของฉัน</h2>
            <Link href="/class/create" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              + เพิ่มวิชาใหม่
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <Link key={classItem.id} href={`/class/${classItem.id}`} className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="bg-blue-600 p-4 text-white">
                  <h3 className="font-bold">{classItem.name}</h3>
                  <p>{classItem.code}</p>
                </div>
                <div className="p-4">
                  <p className="text-gray-600">ภาคเรียน: {classItem.term}</p>
                  <p className="text-gray-600">นักเรียน: {classItem.students} คน</p>
                  <div className="mt-4 flex justify-end">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      เปิดสอน
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/class/create" className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-100 transition">
              <div className="text-center">
                <div className="mx-auto bg-gray-200 rounded-full p-3 h-12 w-12 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="mt-2 text-gray-600">เพิ่มรายวิชาใหม่</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}