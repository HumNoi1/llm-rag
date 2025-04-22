"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';

// คอมโพเนนต์สำหรับการ์ดรายวิชาที่แสดงในหน้าแดชบอร์ด
export default function ClassCard({ classItem }) {
  const router = useRouter();

  // ฟังก์ชันจัดการเมื่อคลิกที่การ์ดรายวิชา
  const handleClick = () => {
    // ใช้ router.push เพื่อนำทางไปยังหน้ารายละเอียดรายวิชา
    // ต้องแน่ใจว่า id มีค่าและเป็นสตริง
    if (classItem && classItem.id) {
      router.push(`/class/${classItem.id}`);
    } else {
      console.error('ไม่พบ ID ของรายวิชา:', classItem);
    }
  };

  // ถ้าไม่มีข้อมูลรายวิชา ให้แสดงการ์ดว่างเปล่า
  if (!classItem) {
    return null;
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
      onClick={handleClick}
    >
      <div className="bg-blue-600 p-4 text-white">
        <h3 className="font-bold">{classItem.name || classItem.code}</h3>
        <p>{classItem.code}</p>
      </div>
      <div className="p-4">
        <p className="text-gray-600">ภาคเรียน: {classItem.semester}/{classItem.academic_year || classItem.year}</p>
        <p className="text-gray-600">นักเรียน: {classItem.students_count || classItem.students || 0} คน</p>
        <div className="mt-4 flex justify-end">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            classItem.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {classItem.is_active ? 'เปิดสอน' : 'ปิดการสอน'}
          </span>
        </div>
      </div>
    </div>
  );
}