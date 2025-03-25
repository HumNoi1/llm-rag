// frontend/src/app/api/auth/verify-email/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: 'โทเค็นไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // เชื่อมต่อกับ HumNoti API เพื่อยืนยันอีเมล
    const response = await fetch('https://your-humnoti-api-url/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUMNOTI_API_KEY}`,
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'ไม่สามารถยืนยันอีเมลได้' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: 'ยืนยันอีเมลสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error during email verification:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}