// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// ตั้งค่า Supabase client
const supabaseUrl = 'https://sexmxxatzrhtrmqiacjn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleG14eGF0enJodHJtcWlhY2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NTk1MTcsImV4cCI6MjA1NzMzNTUxN30.bvgv9shuBt91MNsiG_PGVYD9FNArp9ZFnqZx_MN9WxU';

// ตรวจสอบว่าตัวแปรสิ่งแวดล้อมถูกกำหนดค่าหรือไม่ในโหมด development
if (process.env.NODE_ENV !== 'production' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('⚠️ กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env.local');
}

// สร้าง Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;