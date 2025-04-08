// frontend/src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    // อ่านข้อมูล JSON จาก request
    const { fullName, email, password, academicPosition } = await request.json();
    
    // สร้าง Supabase client ฝั่ง server
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // ลงทะเบียนผู้ใช้ใหม่
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    
    // เพิ่มข้อมูลผู้ใช้ในตาราง users
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        { 
          id: authData.user.id,
          full_name: fullName,
          email,
          academic_position: academicPosition,
        }
      ]);
      
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, userId: authData.user.id }, { status: 201 });
    
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}