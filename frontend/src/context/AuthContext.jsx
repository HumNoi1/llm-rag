// frontend/src/context/AuthContext.jsx
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';

// สร้าง Context สำหรับข้อมูล Auth
const AuthContext = createContext();

// Provider component ที่จะครอบ App
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // เช็คสถานะ user เมื่อโหลดหน้า
  useEffect(() => {
    // ดึงข้อมูล session ปัจจุบัน
    async function getInitialSession() {
      setLoading(true);
      try {
        // ดึงข้อมูล session จาก Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
        }
        
        if (data?.session) {
          // ถ้ามี session ให้ตั้งค่า user
          setUser(data.session.user);
          
          // ดึงข้อมูลเพิ่มเติมของ user จากตาราง profiles (ถ้ามี)
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileData) {
            // รวมข้อมูล user กับข้อมูลจาก profile
            setUser({
              ...data.session.user,
              profile: profileData
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // สมัครฟังก์ชัน event AUTH_STATE_CHANGE
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth event: ${event}`, session);
        
        if (session?.user) {
          setUser(session.user);
          
          // ดึงข้อมูลเพิ่มเติมของ user จากตาราง profiles
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            setUser({
              ...session.user,
              profile: profileData
            });
          }
        } else {
          setUser(null);
          
          // ถ้าอยู่ในหน้าที่ต้องล็อกอินแล้วไม่มี session ให้กลับไปหน้า login
          if (window.location.pathname !== '/login' && 
              window.location.pathname !== '/register') {
            router.push('/login');
          }
        }
      }
    );

    // ยกเลิกการสมัครเมื่อ component unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  // ฟังก์ชันล็อกอิน
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error };
    }
  };

  // ฟังก์ชันลงทะเบียน
  const register = async (email, password, userData) => {
    try {
      // ลงทะเบียน user ใหม่
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData // ข้อมูลเพิ่มเติม
        }
      });
      
      if (error) {
        throw error;
      }
      
      // สร้างข้อมูลใน profiles table
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: email,
            full_name: userData.full_name,
            academic_position: userData.academic_position,
            created_at: new Date().toISOString()
          }]);
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error };
    }
  };

  // ฟังก์ชันล็อกเอาท์
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      router.push('/login');
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error };
    }
  };

  // ส่งค่า context
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook สำหรับการใช้งาน context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}