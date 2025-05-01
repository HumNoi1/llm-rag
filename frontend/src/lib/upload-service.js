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
    if (!file || !bucket) {
      throw new Error('ไฟล์หรือชื่อ bucket ไม่ถูกต้อง');
    }

    // สร้าง unique filename ด้วย timestamp และชื่อไฟล์เดิม
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name}`;
    
    // กำหนด path ในการเก็บไฟล์
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // กำหนด options สำหรับการอัปโหลด
    const uploadOptions = {
      cacheControl: '3600',
      upsert: false
    };
    
    // เพิ่ม onUploadProgress ถ้ามีการระบุ
    if (onProgress && typeof onProgress === 'function') {
      uploadOptions.onUploadProgress = (progress) => {
        // คำนวณเปอร์เซ็นต์ความคืบหน้า
        const percent = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percent);
      };
    }
    
    // อัปโหลดไฟล์ไปยัง Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, uploadOptions);
    
    if (error) {
      console.error('Supabase storage upload error details:', JSON.stringify(error));
      throw new Error(`อัปโหลดไฟล์ล้มเหลว: ${error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    }
    
    if (!data) {
      throw new Error('อัปโหลดสำเร็จแต่ไม่ได้รับข้อมูลผลลัพธ์');
    }
    
    // สร้าง public URL สำหรับไฟล์
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.warn('ไม่สามารถสร้าง public URL ได้');
    }
    
    return {
      success: true,
      data: {
        ...data,
        publicUrl: publicUrlData?.publicUrl || '',
        fileName: fileName,
        originalName: file.name,
        path: filePath
      }
    };
  } catch (error) {
    console.error('Error uploading file:', error.message || error);
    return {
      success: false,
      error: error.message || 'ไม่สามารถอัปโหลดไฟล์ได้'
    };
  }
};

/**
 * ตรวจสอบว่า bucket มีอยู่จริงหรือไม่
 * @param {string} bucket - ชื่อ bucket ที่ต้องการตรวจสอบ
 * @returns {Promise<boolean>} ผลการตรวจสอบ
 */
export const checkBucketExists = async (bucket) => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucket);
    
    if (error || !data) {
      console.warn(`Bucket '${bucket}' ไม่มีอยู่หรือไม่สามารถเข้าถึงได้`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking bucket '${bucket}':`, error);
    return false;
  }
};

/**
 * สร้าง bucket ใหม่ถ้าไม่มีอยู่
 * @param {string} bucket - ชื่อ bucket ที่ต้องการสร้าง
 * @param {boolean} isPublic - กำหนดให้ bucket เป็น public หรือไม่
 * @returns {Promise<boolean>} ผลการสร้าง bucket
 */
export const createBucketIfNotExists = async (bucket, isPublic = true) => {
  try {
    // ตรวจสอบว่า bucket มีอยู่แล้วหรือไม่
    const exists = await checkBucketExists(bucket);
    
    if (exists) {
      console.log(`Bucket '${bucket}' มีอยู่แล้ว`);
      return true;
    }
    
    // สร้าง bucket ใหม่
    const { data, error } = await supabase.storage.createBucket(bucket, {
      public: isPublic,
      fileSizeLimit: 10485760, // 10MB
    });
    
    if (error) {
      console.error(`ไม่สามารถสร้าง bucket '${bucket}' ได้:`, error);
      return false;
    }
    
    console.log(`สร้าง bucket '${bucket}' สำเร็จ`);
    return true;
  } catch (error) {
    console.error(`Error creating bucket '${bucket}':`, error);
    return false;
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
    if (!filePath || !bucket) {
      throw new Error('path ของไฟล์หรือชื่อ bucket ไม่ถูกต้อง');
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error('Supabase storage delete error details:', JSON.stringify(error));
      throw new Error(`ลบไฟล์ล้มเหลว: ${error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error deleting file:', error.message || error);
    return {
      success: false,
      error: error.message || 'ไม่สามารถลบไฟล์ได้'
    };
  }
};