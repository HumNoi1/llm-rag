// frontend/src/app/page.js
import { redirect } from 'next/navigation';

export default function Home() {
  // ทำการ redirect ไปยังหน้า login ทันทีเมื่อเข้าถึงหน้าแรก
  redirect('/login');
  
  // ส่วนนี้จะไม่ถูกเรียกใช้เนื่องจากมีการ redirect ก่อนหน้านี้แล้ว
  // แต่ต้องมี return statement เพื่อความสมบูรณ์ของฟังก์ชัน
  return null;
}