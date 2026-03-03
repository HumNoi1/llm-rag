// frontend/src/lib/fileValidator.js
// Utility สำหรับ validate ไฟล์ก่อน upload — ใช้ร่วมกันใน FileUploader และ MultipleFileUploader

const ALLOWED_PDF_TYPES = ['application/pdf'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * ตรวจสอบไฟล์ก่อนอัปโหลด
 * @param {File} file - ไฟล์ที่ต้องการตรวจสอบ
 * @param {string[]} [allowedTypes] - MIME types ที่อนุญาต (default: PDF)
 * @param {number} [maxSizeBytes] - ขนาดสูงสุดในหน่วย bytes (default: 10MB)
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateFile(
    file,
    allowedTypes = ALLOWED_PDF_TYPES,
    maxSizeBytes = MAX_FILE_SIZE_BYTES
) {
    if (!file) {
        return { valid: false, error: 'ไม่พบไฟล์' };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `ประเภทไฟล์ไม่ถูกต้อง (รองรับ: ${allowedTypes.map((t) => t.split('/')[1]).join(', ')})`,
        };
    }

    if (file.size > maxSizeBytes) {
        const maxMB = maxSizeBytes / (1024 * 1024);
        return {
            valid: false,
            error: `ขนาดไฟล์ใหญ่เกินไป (สูงสุด ${maxMB} MB)`,
        };
    }

    return { valid: true, error: null };
}
