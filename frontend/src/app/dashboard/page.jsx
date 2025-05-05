// frontend/src/app/dashboard/page.jsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ClassCard from '@/components/ClassCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';

export default function Dashboard() {
  // ใช้ auth context
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // สร้าง state สำหรับเก็บข้อมูลรายวิชา
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false); // เริ่มต้นเป็น false
  const [error, setError] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);

  // ฟังก์ชันดึงข้อมูลรายวิชา
  const fetchClasses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // ดึงข้อมูลจากตาราง classes
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id);

      if (error) {
        throw error;
      }

      console.log('ข้อมูลรายวิชาที่ดึงมา:', data);
      setClasses(data || []);
      setDataFetched(true);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('ไม่สามารถดึงข้อมูลได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลเฉพาะครั้งแรกที่โหลดหน้า Dashboard
  useEffect(() => {
    if (user && !dataFetched) {
      fetchClasses();
    }
  }, [user, dataFetched]);

  // ฟังก์ชัน refresh ข้อมูลเมื่อคลิกปุ่ม
  const handleRefresh = () => {
    fetchClasses();
  };

  // ฟังก์ชันสำหรับออกจากระบบ
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header user={user} onLogout={handleLogout} />

        <main className="container mx-auto p-4 md:p-6">
          {/* ปุ่ม refresh ข้อมูล */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleRefresh}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-700">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
              <button 
                onClick={handleRefresh}
                className="mt-2 text-sm font-medium text-red-700 hover:underline"
              >
                ลองอีกครั้ง
              </button>
            </div>
          ) : (
            <>
              {/* ส่วนข้อมูลสรุป - แสดงเพียงการ์ดเดียว */}
              <div className="mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-sm">
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
              </div>

              {/* ส่วนคลาสเรียน */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-black">รายวิชาของฉัน</h2>
                  <Link 
                    href="/class/create" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    + เพิ่มวิชาใหม่
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* แสดงรายการรายวิชา */}
                  {classes.length > 0 ? (
                    <>
                      {classes.map(classItem => (
                        <ClassCard key={classItem.id} classItem={classItem} />
                      ))}
                      
                      {/* การ์ดเพิ่มรายวิชาใหม่ */}
                      <Link 
                        href="/class/create" 
                        className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-100 transition"
                      >
                        <div className="text-center">
                          <div className="mx-auto bg-gray-200 rounded-full p-3 h-12 w-12 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <p className="mt-2 text-gray-600">เพิ่มรายวิชาใหม่</p>
                        </div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="col-span-3 text-center py-8">
                        <p className="text-gray-500">ยังไม่มีรายวิชา</p>
                      </div>
                      
                      {/* การ์ดเพิ่มรายวิชาใหม่สำหรับกรณีไม่มีรายวิชา */}
                      <div className="col-span-3 flex justify-center">
                        <Link 
                          href="/class/create" 
                          className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-100 transition max-w-xs w-full"
                        >
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
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}