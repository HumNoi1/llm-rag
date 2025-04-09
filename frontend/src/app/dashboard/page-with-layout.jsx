// frontend/src/app/dashboard/page-with-sidebar.jsx
"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout-with-sidebar';
import { PrimaryButtonLink, SecondaryButtonLink } from '@/components/ui/NavLink';

// ปรับปรุง Dashboard UI ให้ใช้ DashboardLayout ที่มี Sidebar
export default function DashboardPage() {
  // ข้อมูลจำลองสำหรับการแสดงผล
  const [classes, setClasses] = useState([
    { id: 1, name: 'วิศวกรรมซอฟต์แวร์', code: 'SW101', term: '1/2566', students: 45 },
    { id: 2, name: 'การวิเคราะห์และออกแบบเชิงวัตถุ', code: 'SW201', term: '1/2566', students: 38 },
    { id: 3, name: 'การพัฒนาเว็บแอปพลิเคชัน', code: 'SW301', term: '1/2566', students: 42 },
  ]);

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, action: 'ตรวจข้อสอบ', subject: 'วิศวกรรมซอฟต์แวร์', date: '15 มี.ค. 2025', status: 'เสร็จสิ้น' },
    { id: 2, action: 'อัปโหลดเฉลย', subject: 'การวิเคราะห์และออกแบบเชิงวัตถุ', date: '14 มี.ค. 2025', status: 'เสร็จสิ้น' },
    { id: 3, action: 'สร้างคลาส', subject: 'การพัฒนาเว็บแอปพลิเคชัน', date: '10 มี.ค. 2025', status: 'เสร็จสิ้น' },
  ]);

  // จำลองการดึงข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    // ในอนาคตจะดึงข้อมูลจริงจาก API
    console.log('โหลดข้อมูลแดชบอร์ด');
  }, []);

  return (
    <DashboardLayout>
      {/* หัวข้อหน้า */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-600 mt-1">ภาพรวมของระบบและกิจกรรมล่าสุด</p>
      </div>

      {/* ส่วนข้อมูลสรุป */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="ข้อมูลรายวิชา" 
          value={classes.length} 
          description="วิชาที่สอนทั้งหมด" 
          icon={<BookIcon />} 
          bgColor="bg-blue-100" 
          iconColor="text-blue-600" 
        />
        
        <StatCard 
          title="นักเรียนทั้งหมด" 
          value="125" 
          description="คนที่ลงทะเบียนทั้งหมด" 
          icon={<UsersIcon />} 
          bgColor="bg-green-100" 
          iconColor="text-green-600" 
        />
        
        <StatCard 
          title="งานที่ต้องตรวจ" 
          value="28" 
          description="ข้อสอบที่รอการตรวจ" 
          icon={<DocumentIcon />} 
          bgColor="bg-purple-100" 
          iconColor="text-purple-600" 
        />
      </div>

      {/* ส่วนคลาสเรียน */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">รายวิชาของฉัน</h2>
          <PrimaryButtonLink href="/class/create">
            + เพิ่มวิชาใหม่
          </PrimaryButtonLink>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <ClassCard 
              key={classItem.id} 
              classItem={classItem} 
            />
          ))}
          <AddClassCard />
        </div>
      </div>

      {/* ส่วนกิจกรรมล่าสุด */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">กิจกรรมล่าสุด</h2>
          <SecondaryButtonLink href="/activities" className="text-sm">
            ดูทั้งหมด
          </SecondaryButtonLink>
        </div>
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
                  <ActivityRow 
                    key={activity.id} 
                    activity={activity} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Component สำหรับแสดงข้อมูลสถิติ
function StatCard({ title, value, description, icon, bgColor, iconColor }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-full`}>
          <div className={`h-8 w-8 ${iconColor}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component สำหรับแสดงการ์ดของคลาสเรียน
function ClassCard({ classItem }) {
  return (
    <SecondaryButtonLink 
      href={`/class/${classItem.id}`} 
      className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition p-0"
    >
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
    </SecondaryButtonLink>
  );
}

// Component สำหรับปุ่มเพิ่มคลาสเรียน
function AddClassCard() {
  return (
    <SecondaryButtonLink 
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
    </SecondaryButtonLink>
  );
}

// Component สำหรับแสดงข้อมูลกิจกรรมในตาราง
function ActivityRow({ activity }) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">{activity.action}</td>
      <td className="px-6 py-4 whitespace-nowrap">{activity.subject}</td>
      <td className="px-6 py-4 whitespace-nowrap">{activity.date}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          {activity.status}
        </span>
      </td>
    </tr>
  );
}

// Icons components
function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}