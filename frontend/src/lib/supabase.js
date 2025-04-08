// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// ข้อมูลการเชื่อมต่อ Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// สร้าง Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;