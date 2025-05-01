// frontend/src/lib/storage-config.js
/**
 * กำหนดค่าสำหรับการใช้งาน Supabase Storage
 */

// ชื่อ buckets ใน Supabase Storage
export const STORAGE_BUCKETS = {
    ANSWER_KEYS: 'Answer_Keys',
    STUDENT_ANSWERS: 'Student_Answers',
    // ...
  };
  
  // ขนาดไฟล์สูงสุดที่อนุญาตให้อัปโหลด (ในหน่วย MB)
  export const MAX_FILE_SIZE = {
    PDF: 10,
    IMAGE: 5,
    ATTACHMENT: 20
  };
  
  // ประเภทไฟล์ที่อนุญาตให้อัปโหลด
  export const ALLOWED_FILE_TYPES = {
    PDF: ['application/pdf'],
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  
  /**
   * ตรวจสอบว่าไฟล์มีขนาดไม่เกินที่กำหนดหรือไม่
   * @param {File} file - ไฟล์ที่ต้องการตรวจสอบ
   * @param {string} fileType - ประเภทของไฟล์ (PDF, IMAGE, ATTACHMENT)
   * @returns {boolean} - ผลการตรวจสอบ
   */
  export const isValidFileSize = (file, fileType) => {
    const maxSizeInBytes = MAX_FILE_SIZE[fileType] * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  };
  
  /**
   * ตรวจสอบว่าไฟล์มีประเภทที่อนุญาตหรือไม่
   * @param {File} file - ไฟล์ที่ต้องการตรวจสอบ
   * @param {string} fileCategory - หมวดหมู่ของไฟล์ (PDF, IMAGE, DOCUMENT)
   * @returns {boolean} - ผลการตรวจสอบ
   */
  export const isValidFileType = (file, fileCategory) => {
    return ALLOWED_FILE_TYPES[fileCategory].includes(file.type);
  };
  
  /**
   * ตรวจสอบความถูกต้องของไฟล์ทั้งขนาดและประเภท
   * @param {File} file - ไฟล์ที่ต้องการตรวจสอบ
   * @param {string} fileCategory - หมวดหมู่ของไฟล์ (PDF, IMAGE, DOCUMENT)
   * @param {string} fileType - ประเภทของไฟล์สำหรับการตรวจสอบขนาด (PDF, IMAGE, ATTACHMENT)
   * @returns {Object} - ผลการตรวจสอบ {valid: boolean, error: string}
   */
  export const validateFile = (file, fileCategory, fileType) => {
    if (!file) {
      return { valid: false, error: 'ไม่พบไฟล์' };
    }
    
    // ตรวจสอบประเภทไฟล์
    if (!isValidFileType(file, fileCategory)) {
      return { 
        valid: false, 
        error: `ประเภทไฟล์ไม่ถูกต้อง ต้องเป็น ${ALLOWED_FILE_TYPES[fileCategory].join(', ')}` 
      };
    }
    
    // ตรวจสอบขนาดไฟล์
    if (!isValidFileSize(file, fileType)) {
      return { 
        valid: false, 
        error: `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE[fileType]} MB` 
      };
    }
    
    return { valid: true, error: null };
  };