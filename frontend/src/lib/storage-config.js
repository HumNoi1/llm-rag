// frontend/src/lib/storage-config.js

/**
 * กำหนดชื่อ buckets สำหรับจัดเก็บไฟล์ตามที่มีอยู่ใน Supabase Dashboard
 */
export const STORAGE_BUCKETS = {
    // ใช้ชื่อ bucket ตามที่มีจริงในระบบ Supabase ของคุณ
    ANSWER_KEYS: 'Answer_Keys',  // แก้ไขเป็นชื่อถูกต้องตามที่เห็นในภาพ
    STUDENT_ANSWERS: 'Student_Answers', // แก้ไขเป็นชื่อถูกต้องตามที่เห็นในภาพ
  };
  
  /**
   * ตรวจสอบความถูกต้องของไฟล์
   * @param {File} file - ไฟล์ที่ต้องการตรวจสอบ
   * @param {string} expectedType - ประเภทไฟล์ที่ต้องการ (เช่น 'PDF')
   * @param {string} fileDescription - คำอธิบายไฟล์ (เช่น 'เฉลย')
   * @returns {Object} ผลการตรวจสอบ { valid: boolean, error: string }
   */
  export function validateFile(file, expectedType, fileDescription) {
    // ตรวจสอบว่ามีไฟล์หรือไม่
    if (!file) {
      return {
        valid: false,
        error: `กรุณาเลือกไฟล์${fileDescription}`
      };
    }
    
    // ตรวจสอบว่าเป็นไฟล์ PDF หรือไม่
    if (expectedType === 'PDF' && file.type !== 'application/pdf') {
      return {
        valid: false,
        error: `ไฟล์${fileDescription}ต้องเป็น PDF เท่านั้น (ประเภทไฟล์ปัจจุบัน: ${file.type})`
      };
    }
    
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `ไฟล์${fileDescription}มีขนาดใหญ่เกินไป (${fileSizeMB} MB, ขนาดสูงสุด 10MB)`
      };
    }
    
    return { valid: true };
  }