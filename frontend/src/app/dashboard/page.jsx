"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import ClassCard from '@/components/ClassCard'; 
import supabase from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // สร้าง state สำหรับเก็บข้อมูลรายวิชา
  const [classes, setClasses] = useState([]);
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, action: 'ตรวจข้อสอบ', subject: 'วิศวกรรมซอฟต์แวร์', date: '15 มี.ค. 2025', status: 'เสร็จสิ้น' },
    { id: 2, action: 'อัปโหลดเฉลย', subject: 'การวิเคราะห์และออกแบบเชิงวัตถุ', date: '14 มี.ค. 2025', status: 'เสร็จสิ้น' },
    { id: 3, action: 'สร้างคลาส', subject: 'การพัฒนาเว็บแอปพลิเคชัน', date: '10 มี.ค. 2025', status: 'เสร็จสิ้น' },
  ]);

  // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อโหลดหน้า
  useEffect(() => {
    // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
    const checkLoginStatus = async () => {
      try {
        setLoading(true);
        
        // ตรวจสอบจาก Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          // หากมีข้อผิดพลาดในการดึงข้อมูล session
          handleLogout();
          return;
        }
        
        if (session?.user) {
          setIsLoggedIn(true);
          setUser(session.user);
          // ดึงข้อมูลรายวิชาจาก Supabase
          fetchClasses(session.user.id);
        } else {
          // จำลองข้อมูลสำหรับการพัฒนา (จะลบออกเมื่อใช้งานจริง)
          setIsLoggedIn(true);
          setUser({ name: 'อาจารย์ ทดสอบ' });
          
          // จำลองข้อมูลสำหรับการพัฒนา
          
          setClasses(mockClasses);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkLoginStatus();
  }, []);

  // ฟังก์ชันสำหรับดึงข้อมูลรายวิชาจาก Supabase
  const fetchClasses = async (userId) => {
    try {
      console.log('Fetching classes for user ID:', userId);
      
      // ดึงข้อมูลจากตาราง classes
      const { data, error } = await supabase
        .from('classes')
        .select('*');
        // ถ้าต้องการกรองตาม teacher_id ให้เพิ่มบรรทัดนี้:
        // .eq('teacher_id', userId);

      if (error) {
        throw error;
      }

      console.log('ข้อมูลรายวิชาที่ดึงมา:', data);
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  // ฟังก์ชันสำหรับออกจากระบบ
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // เคลียร์ข้อมูลผู้ใช้และนำทางกลับไปหน้าล็อกอิน
      setIsLoggedIn(false);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // แสดงหน้า loading
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

  // ถ้าไม่ได้เข้าสู่ระบบ จะถูก redirect ด้วย useEffect ด้านบน
  if (!isLoggedIn || !user) {
    return null;
  }

  // แสดงหน้าแดชบอร์ด
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />

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
                <p className="text-3xl font-bold text-black">
                  {classes.reduce((total, classItem) => total + (classItem.students_count || 0), 0)}
                </p>
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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-black">รายวิชาของฉัน</h2>
            {/* ใช้ Link แทนปุ่มธรรมดา */}
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

        {/* ส่วนกิจกรรมล่าสุด */}
        <div>
          <h2 className="text-black mb-4">กิจกรรมล่าสุด</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">กิจกรรม</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิชา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{activity.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{activity.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{activity.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}