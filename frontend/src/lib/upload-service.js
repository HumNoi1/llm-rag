// frontend/src/lib/upload-service.js
import supabase from './supabase';

/**
 * อัปโหลดไฟล์ไปยัง Supabase Storage
 * @param {File} file - ไฟล์ที่ต้องการอัปโหลด
 * @param {string} bucket - ชื่อ bucket ที่ต้องการเก็บไฟล์
 * @param {string} folder - โฟลเดอร์ใน bucket (ถ้ามี)
 * @param {Function} onProgress - callback สำหรับการแสดงความคืบหน้า (optional)
 * @returns {Promise<Object>} ข้อมูลไฟล์ที่อัปโหลด
 */
export const uploadFile = async (file, bucket, folder = '', onProgress = null) => {
  try {
    // สร้าง unique filename ด้วย timestamp และชื่อไฟล์เดิม
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name}`;
    
    // กำหนด path ในการเก็บไฟล์
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // อัปโหลดไฟล์ไปยัง Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        // ใช้ onProgress ถ้ามีการส่งมา
        onUploadProgress: onProgress ? (progress) => {
          // คำนวณเปอร์เซ็นต์ความคืบหน้า
          const percent = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percent);
        } : undefined
      });
    
    if (error) {
      throw error;
    }
    
    // สร้าง public URL สำหรับไฟล์
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return {
      success: true,
      data: {
        ...data,
        publicUrl: publicUrlData.publicUrl,
        fileName: fileName,
        originalName: file.name
      }
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message || 'ไม่สามารถอัปโหลดไฟล์ได้'
    };
  }
};

/**
 * ลบไฟล์จาก Supabase Storage
 * @param {string} filePath - path ของไฟล์ที่ต้องการลบ
 * @param {string} bucket - ชื่อ bucket ที่เก็บไฟล์
 * @returns {Promise<Object>} ผลการลบไฟล์
 */
export const deleteFile = async (filePath, bucket) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error.message || 'ไม่สามารถลบไฟล์ได้'
    };
  }
};