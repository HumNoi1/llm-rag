// frontend/src/components/Header.jsx
"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
          <Link href="/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded-md transition-colors">
            แดชบอร์ด
          </Link>
          <Link href="/classes" className="hover:bg-blue-700 px-3 py-2 rounded-md transition-colors">
            รายวิชา
          </Link>
          <Link href="/exams" className="hover:bg-blue-700 px-3 py-2 rounded-md transition-colors">
            ข้อสอบ
          </Link>
          
          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <span>อาจารย์ มหาวิทยาลัย</span>
            <div className="bg-blue-700 p-2 rounded-full h-10 w-10 flex items-center justify-center">
              <span className="font-semibold">AM</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden mt-2">
          <div className="flex flex-col space-y-2 px-2 pt-2 pb-3">
            <Link 
              href="/dashboard"
              className="text-white block px-3 py-2 rounded-md hover:bg-blue-700"
              onClick={() => setIsMenuOpen(false)}
            >
              แดชบอร์ด
            </Link>
            <Link 
              href="/classes"
              className="text-white block px-3 py-2 rounded-md hover:bg-blue-700"
              onClick={() => setIsMenuOpen(false)}
            >
              รายวิชา
            </Link>
            <Link 
              href="/exams"
              className="text-white block px-3 py-2 rounded-md hover:bg-blue-700"
              onClick={() => setIsMenuOpen(false)}
            >
              ข้อสอบ
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}