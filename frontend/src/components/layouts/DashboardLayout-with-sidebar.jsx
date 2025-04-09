// frontend/src/components/layouts/DashboardLayout-with-sidebar.jsx
"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

// Layout Component สำหรับหน้าที่ต้องการ navigation และ UI แบบ dashboard พร้อม Sidebar
export default function DashboardLayout({ children }) {
  // State สำหรับควบคุมการแสดง/ซ่อน Sidebar บนอุปกรณ์มือถือ
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // เปิด Sidebar
  const openSidebar = () => {
    setSidebarOpen(true);
  };
  
  // ปิด Sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      {/* Header แบบเดียวกันสำหรับทุกหน้าที่ใช้ Layout นี้ */}
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - ส่งค่า isOpen เข้าไปเพื่อควบคุมการแสดง/ซ่อนบนมือถือ */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        {/* เนื้อหาหลัก */}
        <main className="flex-1 overflow-y-auto">
          {/* ปุ่มเปิด Sidebar สำหรับมือถือ */}
          <div className="p-4 md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={openSidebar}
            >
              <span className="sr-only">เปิดเมนู</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {/* Container สำหรับเนื้อหา */}
          <div className="container mx-auto px-4 py-4 md:py-6">
            {children}
          </div>
        </main>
      </div>
      
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