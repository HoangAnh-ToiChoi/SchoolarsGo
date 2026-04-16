/**
 * Storage Service —封装 Supabase Storage 操作
 *
 * Chỉ dùng @supabase/supabase-js CHO RIÊNG phần Storage (không dùng cho DB).
 * DB vẫn dùng pg pool thuần (bỏ qua RLS ở DB level).
 *
 * Supabase Storage có RLS riêng → cần dùng service_role key để bypass.
 * File được đặt trong bucket "documents" với path: /{user_id}/{type}/{filename}
 *
 * Các lỗi cần xử lý:
 * - Upload thất bại → throw có isOperational = true để Global Error Handler chụp
 * - Trùng tên file → sinh UUID nối vào tên file sau khi slugify
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = 'documents';

/**
 * Slugify tên file — chuẩn hóa tên file trước khi upload lên Supabase Storage
 *
 * Luồng xử lý:
 *  1. Tách extension ra trước (tránh mất dấu . trong body tiếng Việt)
 *  2. Loại bỏ dấu tiếng Việt bằng NFD normalization + strip combining marks
 *  3. Chuyển khoảng trắng thành dấu gạch ngang (-)
 *  4. Xóa ký tự đặc biệt []() và ký tự không an toàn cho filesystem
 *  5. Collapse nhiều gạch ngang liên tiếp
 *  6. Giới hạn độ dài body (200 ký tự)
 *
 * Ví dụ:
 *   "[CMP376] Giáo trình HP Thực hành Lập trình web (1).pdf"
 *     → "cmp376-giao-trinh-hp-thuc-hanh-lap-trinh-web-1.pdf"
 *
 * @param {string} fileName - Tên file gốc từ client
 * @returns {string} Tên file đã sanitize, an toàn cho Supabase Storage
 */
const slugifyFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return `file_${Date.now()}`;
  }

  // Tách extension để giữ nguyên đuôi file
  const lastDot = fileName.lastIndexOf('.');
  const hasExtension = lastDot > 0 && lastDot < fileName.length - 1;
  const rawExt = hasExtension ? fileName.slice(lastDot + 1).toLowerCase() : '';
  const body = hasExtension ? fileName.slice(0, lastDot) : fileName;

  // Loại bỏ dấu tiếng Việt: "Giáo" → "Giao", "trình" → "trinh"
  const normalized = body.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Chuyển khoảng trắng thành dấu gạch ngang
  const withDashes = normalized.replace(/\s+/g, '-');

  // Xóa ký tự đặc biệt — chỉ giữ chữ cái Latin, số, dấu gạch ngang
  const sanitized = withDashes.replace(/[^a-zA-Z0-9-]/g, '');

  // Collapse nhiều dấu gạch ngang liên tiếp thành 1, bỏ gạch đầu/cuối
  const collapsed = sanitized.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  // Giới hạn độ dài body (an toàn với Supabase path limit 1024 bytes)
  const truncated = collapsed.length > 200 ? collapsed.slice(0, 200) : collapsed;

  const safeFileName = rawExt ? `${truncated}.${rawExt}` : truncated;
  return safeFileName || `file_${Date.now()}`;
};

/**
 * Upload file lên Supabase Storage
 *
 * @param {string}   userId       - ID của user
 * @param {string}   docType      - Loại document: cv, sop, transcript, recommendation_letter, other
 * @param {Buffer}   fileBuffer   - Nội dung file (từ multer.memoryStorage())
 * @param {string}   originalName - Tên gốc của file (sẽ được slugify)
 * @param {string}   mimeType     - MIME type của file
 * @returns {Promise<{publicUrl: string, storagePath: string}>}
 */
const uploadFile = async (userId, docType, fileBuffer, originalName, mimeType) => {
  // Slugify tên file để tránh lỗi path từ ký tự đặc biệt / tiếng Việt
  const slugifiedName = slugifyFileName(originalName);
  const randomSuffix = crypto.randomUUID().slice(0, 8);
  const ext = slugifiedName.includes('.') ? slugifiedName.split('.').pop() : '';
  const baseName = ext ? slugifiedName.slice(0, -(ext.length + 1)) : slugifiedName;
  const fileName = ext ? `${baseName}_${randomSuffix}.${ext}` : `${baseName}_${randomSuffix}`;

  const storagePath = `${userId}/${docType}/${fileName}`;

  let uploadData;
  try {
    const result = await supabaseStorage.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (result.error) {
      console.error('[Supabase Upload Error]:', result.error);
      const err = new Error(`Upload file thất bại: ${result.error.message}`);
      err.statusCode = 500;
      err.isOperational = true;
      throw err;
    }

    uploadData = result.data;
  } catch (err) {
    // Giữ nguyên error có isOperational từ khối trên;
    // wrap thêm cho các lỗi async/network không có isOperational
    if (!err.isOperational) {
      console.error('[Supabase Upload Error]:', err);
      const wrapped = new Error(`Upload file thất bại: ${err.message}`);
      wrapped.statusCode = 500;
      wrapped.isOperational = true;
      throw wrapped;
    }
    throw err;
  }

  // getPublicUrl() là hàm đồng bộ — chỉ build string từ config
  // KHÔNG cần try/catch vì không có network call
  const { data: urlData } = supabaseStorage.storage
    .from(BUCKET_NAME)
    .getPublicUrl(uploadData ? uploadData.path : storagePath);

  return {
    publicUrl: urlData.publicUrl,
    storagePath: uploadData ? uploadData.path : storagePath,
  };
};

/**
 * Xóa file khỏi Supabase Storage
 * (Dùng trong rollback khi DB insert thất bại, hoặc khi xóa document)
 *
 * @param {string} storagePath - Đường dẫn file trong bucket (VD: userId/docType/filename)
 * @returns {Promise<void>}
 */
const deleteFile = async (storagePath) => {
  const { error } = await supabaseStorage.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    // Chỉ warn — không throw để không chặn luồng xóa chính
    console.warn(`[Storage] Không thể xóa file ${storagePath}:`, error.message);
  }
};

module.exports = { uploadFile, deleteFile, slugifyFileName };
