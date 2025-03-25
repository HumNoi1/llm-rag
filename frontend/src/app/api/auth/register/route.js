// frontend/src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { fullName, email, password, academicPosition } = await request.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับ HumNoti API เพื่อลงทะเบียนผู้ใช้ใหม่
    const response = await fetch('https://your-humnoti-api-url/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUMNOTI_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        name: fullName,
        metadata: {
          academic_position: academicPosition,
          role: 'teacher',
        },
        // เพิ่มค่า sendEmailVerification เป็น true เพื่อส่งอีเมลยืนยัน
        sendEmailVerification: true
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'ไม่สามารถลงทะเบียนได้' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { 
        message: 'ลงทะเบียนสำเร็จ กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันตัวตน', 
        userId: data.userId || data.user_id || data.id,
        emailVerificationSent: true
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Server error during registration:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}