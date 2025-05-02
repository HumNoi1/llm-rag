// frontend/src/lib/supabase-admin.js
import { createClient } from '@supabase/supabase-js';

// ใช้ Service Role Key สำหรับข้ามการตรวจสอบ RLS
// ต้องเก็บ key นี้ไว้ในไฟล์ .env.local เท่านั้น ไม่ควรเปิดเผยในโค้ด client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Supabase client ที่ใช้ Service Role Key เพื่อข้าม RLS
 * เหมาะสำหรับการใช้ใน API Routes หรือ Server-side functions เท่านั้น
 * ห้ามใช้ใน client-side code เพราะจะเปิดเผย Service Role Key
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabaseAdmin;