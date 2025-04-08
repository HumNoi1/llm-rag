// frontend/src/contexts/AuthContext.js
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// สร้าง Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// สร้าง Context
const AuthContext = createContext();

// Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อโหลด
  useEffect(() => {
    const checkUser = async () => {
      try {
        // ดึงข้อมูล session ปัจจุบัน
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('ไม่สามารถตรวจสอบสถานะผู้ใช้:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // ติดตามการเปลี่ยนแปลงสถานะการเข้าสู่ระบบ
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // ล้างการติดตามเมื่อ unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // ฟังก์ชันออกจากระบบ
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ส่ง Context
  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook สำหรับใช้งาน Context
export function useAuth() {
  return useContext(AuthContext);
}