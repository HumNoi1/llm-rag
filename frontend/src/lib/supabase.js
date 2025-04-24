// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// ตั้งค่า Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// ตรวจสอบว่าตัวแปรสิ่งแวดล้อมถูกกำหนดค่าหรือไม่ในโหมด development
if (process.env.NODE_ENV !== 'production' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('⚠️ กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env.local');
}

// สร้าง Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;