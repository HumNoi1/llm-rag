// frontend/src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase-admin'; // นี่คือ supabase client ที่ใช้ service role key

export async function POST(request) {
  try {
    // รับข้อมูลจาก request
    const requestData = await request.json();
    
    if (!requestData) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลที่ส่งมา' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบข้อมูลที่จำเป็น
    const { file_info, upload_info } = requestData;
    
    if (!file_info || !upload_info) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน กรุณาระบุ file_info และ upload_info' },
        { status: 400 }
      );
    }
    
    // บันทึกข้อมูลลงในตาราง uploads
    const { data, error } = await supabase
      .from('uploads')
      .insert([upload_info])
      .select();
    
    if (error) {
      console.error('Error inserting upload info:', error);
      return NextResponse.json(
        { error: 'ไม่สามารถบันทึกข้อมูลได้: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Error in upload API route:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการประมวลผล: ' + error.message },
      { status: 500 }
    );
  }
}