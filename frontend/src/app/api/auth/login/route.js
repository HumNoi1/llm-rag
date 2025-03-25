// frontend/src/app/api/auth/login/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ตั้งค่า Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!email || !password) {
      return NextResponse.json(
        { message: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      );
    }

    // สร้าง Supabase client ที่มีการจัดการ cookies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storage: cookies()
      }
    });

    // เข้าสู่ระบบด้วย Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'เข้าสู่ระบบสำเร็จ', 
        user: {
          id: data.user.id,
          email: data.user.email
        } 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error during login:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}