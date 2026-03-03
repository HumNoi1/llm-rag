# backend/app/services/supabase_service.py
import requests
from fastapi import HTTPException
from supabase import create_client, Client
from typing import Optional, Dict, Any, Tuple
from ..config import SUPABASE_URL, SUPABASE_KEY

class SupabaseService:
    """Service สำหรับติดต่อกับ Supabase"""

    def __init__(self):
        """เริ่มต้น Supabase Client"""
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("⚠️ ไม่พบ SUPABASE_URL หรือ SUPABASE_KEY - เชื่อมต่อกับ Supabase ไม่ได้")
            self.supabase = None
        else:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    async def download_file_from_url(self, url: str) -> Tuple[bytes, str]:
        """
        ดาวน์โหลดไฟล์จาก URL
        
        Args:
            url: URL ของไฟล์
            
        Returns:
            Tuple[bytes, str]: (เนื้อหาไฟล์, ชื่อไฟล์)
            
        Raises:
            HTTPException: หากไม่สามารถดาวน์โหลดไฟล์ได้
        """
        try:
            # ดึงชื่อไฟล์จาก URL
            filename = url.split('/')[-1]
            
            # ส่ง request เพื่อดาวน์โหลดไฟล์
            response = requests.get(url, stream=True, timeout=30)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"ไม่สามารถดาวน์โหลดไฟล์ได้: {response.reason}"
                )
            
            # อ่านเนื้อหาไฟล์
            content = response.content
            
            return content, filename
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์: {str(e)}"
            )
    
    async def get_file_from_storage(self, bucket: str, path: str) -> Tuple[bytes, str]:
        """
        ดึงไฟล์จาก Supabase Storage
        
        Args:
            bucket: ชื่อ bucket
            path: เส้นทางของไฟล์
            
        Returns:
            Tuple[bytes, str]: (เนื้อหาไฟล์, ชื่อไฟล์)
            
        Raises:
            HTTPException: หากไม่สามารถดึงไฟล์ได้
        """
        if not self.supabase:
            raise HTTPException(
                status_code=500,
                detail="ยังไม่ได้เชื่อมต่อกับ Supabase"
            )
        
        try:
            # ดึงชื่อไฟล์จาก path
            filename = path.split('/')[-1]
            
            # ดึงไฟล์จาก Supabase Storage
            result = self.supabase.storage.from_(bucket).download(path)
            
            return result, filename
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"เกิดข้อผิดพลาดในการดึงไฟล์จาก Supabase: {str(e)}"
            )