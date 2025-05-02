// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// ตั้งค่า Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ตรวจสอบว่าตัวแปรสภาพแวดล้อมถูกกำหนดค่าหรือไม่
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Using fallback values.');
}

// สร้าง Supabase client
const supabase = createClient(
  supabaseUrl || 'https://your-supabase-url.supabase.co',
  supabaseAnonKey || 'your-anon-key',
  {
    auth: {
      persistSession: true, // จัดเก็บ session ใน local storage
      autoRefreshToken: true, // ต่ออายุ token โดยอัตโนมัติ
    }
  }
);

export default supabase;