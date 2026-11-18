/**
 * Supabase Storage cho file tài liệu (bucket "documents", đường dẫn {user_id}/{type}/{tên-file}).
 * Dùng service_role key để vượt RLS của Storage. Tên file được slugify + gắn UUID để không trùng.
 * Upload lỗi thì ném lỗi isOperational để errorHandler trả về cho client.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

let supabaseStorage = null;

const getSupabaseStorage = () => {
  if (supabaseStorage) return supabaseStorage;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    const err = new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for storage operations'
    );
    err.isOperational = true;
    throw err;
  }

  supabaseStorage = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseStorage;
};

const BUCKET_NAME = 'documents';

/**
 * Chuẩn hóa tên file trước khi lên Storage: bỏ dấu tiếng Việt, chỉ giữ chữ Latin/số/gạch ngang, tối đa 200 ký tự.
 * "[CMP376] Giáo trình HP (1).pdf" → "cmp376-giao-trinh-hp-1.pdf"
 */
const slugifyFileName = fileName => {
  if (!fileName || typeof fileName !== 'string') {
    return `file_${Date.now()}`;
  }

  // Tách đuôi file trước để không mất dấu "." trong tên có tiếng Việt
  const lastDot = fileName.lastIndexOf('.');
  const hasExtension = lastDot > 0 && lastDot < fileName.length - 1;
  const rawExt = hasExtension ? fileName.slice(lastDot + 1).toLowerCase() : '';
  const body = hasExtension ? fileName.slice(0, lastDot) : fileName;

  // NFD tách dấu khỏi chữ: "Giáo" → "Giao"
  const normalized = body.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const withDashes = normalized.replace(/\s+/g, '-');
  const sanitized = withDashes.replace(/[^a-zA-Z0-9-]/g, '');
  const collapsed = sanitized.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  // Cắt ngắn để đường dẫn không vượt giới hạn 1024 byte của Supabase
  const truncated = collapsed.length > 200 ? collapsed.slice(0, 200) : collapsed;

  const safeFileName = rawExt ? `${truncated}.${rawExt}` : truncated;
  return safeFileName || `file_${Date.now()}`;
};

async function uploadFile(userId, docType, fileBuffer, originalName, mimeType) {
  const slugifiedName = slugifyFileName(originalName);
  const randomSuffix = crypto.randomUUID().slice(0, 8);
  const ext = slugifiedName.includes('.') ? slugifiedName.split('.').pop() : '';
  const baseName = ext ? slugifiedName.slice(0, -(ext.length + 1)) : slugifiedName;
  const fileName = ext ? `${baseName}_${randomSuffix}.${ext}` : `${baseName}_${randomSuffix}`;

  const storagePath = `${userId}/${docType}/${fileName}`;

  let uploadData;
  try {
    const storage = getSupabaseStorage();
    const result = await storage.storage.from(BUCKET_NAME).upload(storagePath, fileBuffer, {
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
    // Lỗi đã isOperational thì giữ nguyên; lỗi mạng/async khác thì bọc lại thành lỗi 500 trả được cho client
    if (!err.isOperational) {
      console.error('[Supabase Upload Error]:', err);
      const wrapped = new Error(`Upload file thất bại: ${err.message}`);
      wrapped.statusCode = 500;
      wrapped.isOperational = true;
      throw wrapped;
    }
    throw err;
  }

  // getPublicUrl() chỉ ghép chuỗi từ cấu hình (không gọi mạng) nên không cần try/catch
  const { data: urlData } = getSupabaseStorage()
    .storage.from(BUCKET_NAME)
    .getPublicUrl(uploadData ? uploadData.path : storagePath);

  return {
    publicUrl: urlData.publicUrl,
    storagePath: uploadData ? uploadData.path : storagePath,
  };
}

/** Xóa file khỏi Storage (rollback khi lưu DB thất bại, hoặc khi xóa tài liệu). */
async function deleteFile(storagePath) {
  const { error } = await getSupabaseStorage().storage.from(BUCKET_NAME).remove([storagePath]);

  if (error) {
    // Chỉ warn — không throw để không chặn luồng xóa chính
    console.warn(`[Storage] Không thể xóa file ${storagePath}:`, error.message);
  }
}

export { uploadFile, deleteFile, slugifyFileName };