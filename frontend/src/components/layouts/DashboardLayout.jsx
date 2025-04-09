// frontend/src/components/layouts/DashboardLayout.jsx
import React from 'react';
import Header from '@/components/Header';

// Layout Component สำหรับหน้าที่ต้องการ navigation และ UI แบบ dashboard
export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header แบบเดียวกันสำหรับทุกหน้าที่ใช้ Layout นี้ */}
      <Header />
      
      {/* เนื้อหาหลัก */}
      <main className="container mx-auto flex-grow p-4 md:p-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white py-4 border-t border-gray-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 text-sm">© 2025 ระบบผู้ช่วยตรวจข้อสอบอัตนัย</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 text-sm hover:text-blue-600 transition">นโยบายความเป็นส่วนตัว</a>
              <a href="#" className="text-gray-600 text-sm hover:text-blue-600 transition">ข้อกำหนดการใช้งาน</a>
              <a href="#" className="text-gray-600 text-sm hover:text-blue-600 transition">ติดต่อเรา</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}