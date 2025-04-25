// frontend/src/components/Header.jsx
// แก้ไขส่วน User Profile dropdown menu

"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  
  // จัดการการคลิกนอก dropdown เพื่อปิด dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          ระบบผู้ช่วยตรวจข้อสอบอัตนัย
        </Link>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {user && (
            <>
              <Link href="/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded-md transition-colors">
                แดชบอร์ด
              </Link>
              <Link href="/classes" className="hover:bg-blue-700 px-3 py-2 rounded-md transition-colors">
                รายวิชา
              </Link>
              <Link href="/exams" className="hover:bg-blue-700 px-3 py-2 rounded-md transition-colors">
                ข้อสอบ
              </Link>
              
              {/* User Profile - ปรับปรุงส่วนนี้ */}
              <div className="relative" ref={dropdownRef}>
                <div 
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="hidden lg:inline-block">{user.profile?.full_name || user.email}</span>
                  <div className="bg-blue-700 p-2 rounded-full h-10 w-10 flex items-center justify-center">
                    <span className="font-semibold">
                      {user.profile?.full_name ? user.profile.full_name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                </div>
                
                {/* Dropdown Menu - ใช้ state แทน CSS hover */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-xl z-10">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      โปรไฟล์
                    </Link>
                    <Link 
                      href="/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      ตั้งค่า
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          
          {!user && (
            <>
              <Link href="/login" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="border border-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                ลงทะเบียน
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation - ส่วนที่เหลือยังคงเดิม */}
      {/* ... */}
    </header>
  );
}