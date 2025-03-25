// frontend/src/app/verify-email/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setVerifying(false);
        setError('โทเค็นยืนยันอีเมลไม่ถูกต้อง');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'ไม่สามารถยืนยันอีเมลได้');
        }

        setVerified(true);
        
        // หลังจากยืนยันสำเร็จ ให้รอ 3 วินาทีแล้วเปลี่ยนไปยังหน้าล็อกอิน
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error) {
        console.error('Email verification error:', error);
        setError(error.message);
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#D8EAFE]">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        {verifying ? (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-[#333333]">กำลังยืนยันอีเมล</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-gray-600">กรุณารอสักครู่...</p>
          </div>
        ) : verified ? (
          <div>
            <div className="text-green-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#333333]">ยืนยันอีเมลสำเร็จ</h2>
            <p className="mb-6 text-gray-600">อีเมลของคุณได้รับการยืนยันเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบได้ทันที</p>
            <p className="text-gray-500">กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p>
          </div>
        ) : (
          <div>
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#333333]">ไม่สามารถยืนยันอีเมลได้</h2>
            <p className="mb-6 text-red-600">{error}</p>
            <Link
              href="/login"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
            >
              กลับไปยังหน้าเข้าสู่ระบบ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}