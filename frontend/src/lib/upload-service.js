// frontend/src/lib/upload-service.js
import supabase from './supabase';
import { STORAGE_BUCKETS } from './storage-config';

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
    if (!file) {
      return {
        success: false,
        error: 'ไม่พบไฟล์ที่ต้องการอัปโหลด'
      };
    }

    // ตรวจสอบชื่อไฟล์ให้ปลอดภัย
    const fileName = file.name;
    
    // ตรวจสอบว่าชื่อไฟล์มีเฉพาะตัวอักษร a-z, A-Z, 0-9, ., _, - เท่านั้น
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
      console.warn('ชื่อไฟล์ไม่ปลอดภัย:', fileName);
      return {
        success: false,
        error: 'ชื่อไฟล์มีอักขระพิเศษที่ไม่รองรับ กรุณาใช้ภาษาอังกฤษและตัวเลขเท่านั้น'
      };
    }
    
    // กำหนด path ในการเก็บไฟล์
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    console.log('กำลังอัปโหลดไฟล์ไปที่:', bucket, filePath);
    
    // อัปโหลดไฟล์ไปยัง Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        onUploadProgress: onProgress ? (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percent);
        } : undefined
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message || 'ไม่สามารถอัปโหลดไฟล์ได้'
      };
    }
    
    // สร้าง public URL สำหรับไฟล์
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return {
      success: true,
      data: {
        ...data,
        publicUrl: publicUrlData?.publicUrl || '',
        path: filePath,
        fileName: fileName,
        originalName: file.originalName || file.name
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
 * อัปโหลดไฟล์ไปยัง Supabase Storage พร้อมตรวจสอบและสร้าง bucket ถ้าจำเป็น
 * @param {File} file - ไฟล์ที่ต้องการอัปโหลด
 * @param {string} bucket - ชื่อ bucket ที่ต้องการเก็บไฟล์
 * @param {string} folder - โฟลเดอร์ใน bucket (ถ้ามี)
 * @param {Function} onProgress - callback สำหรับการแสดงความคืบหน้า (optional)
 * @returns {Promise<Object>} ข้อมูลไฟล์ที่อัปโหลด
 */
export const uploadFileWithBucketCreation = async (file, bucket, folder = '', onProgress = null) => {
  try {
    // ตรวจสอบว่า bucket มีอยู่แล้วหรือไม่
    const bucketExists = await checkBucketExists(bucket);
    
    // สร้าง bucket ถ้ายังไม่มี
    if (!bucketExists) {
      const bucketCreated = await createBucket(bucket, {
        public: true // ตั้งค่าให้เป็น public bucket
      });
      
      if (!bucketCreated) {
        console.warn(`ไม่สามารถสร้าง bucket "${bucket}" ได้ แต่จะพยายามอัปโหลดไฟล์ต่อไป`);
      }
    }
    
    // อัปโหลดไฟล์โดยใช้ฟังก์ชัน uploadFile ที่มีอยู่แล้ว
    return await uploadFile(file, bucket, folder, onProgress);
  } catch (error) {
    console.error('Error in uploadFileWithBucketCreation:', error);
    return {
      success: false,
      error: error.message || 'ไม่สามารถอัปโหลดไฟล์ได้'
    };
  }
};

/**
 * ตรวจสอบการเชื่อมต่อกับ Supabase
 * @returns {Promise<boolean>} สถานะการเชื่อมต่อ
 */
export const checkSupabaseConnection = async () => {
  try {
    // ทดสอบการเชื่อมต่อด้วยการดึงข้อมูล bucket
    const { data, error } = await supabase.storage.listBuckets();
    return !error;
  } catch (error) {
    console.error('ไม่สามารถเชื่อมต่อกับ Supabase ได้:', error);
    return false;
  }
};

/**
 * ดึงรายการ buckets ทั้งหมด
 * @returns {Promise<Array>} รายการ buckets
 */
export const listAllBuckets = async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('ไม่สามารถดึงรายการ buckets ได้:', error);
    return [];
  }
};

/**
 * ตรวจสอบว่า bucket มีอยู่หรือไม่
 * @param {string} bucketName - ชื่อ bucket ที่ต้องการตรวจสอบ
 * @returns {Promise<boolean>} สถานะการมีอยู่ของ bucket
 */
export const checkBucketExists = async (bucketName) => {
  try {
    // ลองดึงรายการไฟล์จาก bucket เพื่อตรวจสอบว่ามีอยู่หรือไม่
    const { data: buckets } = await supabase.storage.listBuckets();
    return buckets.some(bucket => bucket.name === bucketName);
  } catch (error) {
    console.error(`ไม่สามารถตรวจสอบ bucket "${bucketName}" ได้:`, error);
    return false;
  }
};

/**
 * สร้าง bucket ใหม่
 * @param {string} bucketName - ชื่อ bucket ที่ต้องการสร้าง
 * @param {Object} options - ตัวเลือกสำหรับ bucket
 * @returns {Promise<boolean>} สถานะการสร้าง bucket
 */
export const createBucket = async (bucketName, options = {}) => {
  try {
    const { data, error } = await supabase.storage.createBucket(bucketName, options);
    
    if (error) {
      console.error(`ไม่สามารถสร้าง bucket "${bucketName}" ได้:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`ไม่สามารถสร้าง bucket "${bucketName}" ได้:`, error);
    return false;
  }
};

/**
 * ดึงรายการไฟล์ใน bucket
 * @param {string} bucketName - ชื่อ bucket
 * @param {string} path - path ในการค้นหา
 * @returns {Promise<Array>} รายการไฟล์
 */
export const listFiles = async (bucketName, path = '') => {
  try {
    const { data, error } = await supabase.storage.from(bucketName).list(path);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`ไม่สามารถดึงรายการไฟล์จาก bucket "${bucketName}" ได้:`, error);
    return [];
  }
};