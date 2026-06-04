const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const logger = require('../utils/logger');

let supabaseStorage = null;
const BUCKET_NAME = 'documents';
const SIGNED_URL_TTL_SECONDS = 60 * 15;

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

const slugifyFileName = fileName => {
  if (!fileName || typeof fileName !== 'string') {
    return `file_${Date.now()}`;
  }

  const lastDot = fileName.lastIndexOf('.');
  const hasExtension = lastDot > 0 && lastDot < fileName.length - 1;
  const rawExt = hasExtension ? fileName.slice(lastDot + 1).toLowerCase() : '';
  const body = hasExtension ? fileName.slice(0, lastDot) : fileName;

  const normalized = body.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const withDashes = normalized.replace(/\s+/g, '-');
  const sanitized = withDashes.replace(/[^a-zA-Z0-9-]/g, '');
  const collapsed = sanitized.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  const truncated = collapsed.length > 200 ? collapsed.slice(0, 200) : collapsed;

  const safeFileName = rawExt ? `${truncated}.${rawExt}` : truncated;
  return safeFileName || `file_${Date.now()}`;
};

const uploadFile = async (userId, docType, fileBuffer, originalName, mimeType) => {
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
      logger.error({ err: result.error, storagePath }, 'Supabase upload failed');
      const err = new Error(`Upload file thất bại: ${result.error.message}`);
      err.statusCode = 500;
      err.isOperational = true;
      throw err;
    }

    uploadData = result.data;
  } catch (err) {
    if (!err.isOperational) {
      logger.error({ err, storagePath }, 'Supabase upload failed');
      const wrapped = new Error(`Upload file thất bại: ${err.message}`);
      wrapped.statusCode = 500;
      wrapped.isOperational = true;
      throw wrapped;
    }
    throw err;
  }

  return {
    storagePath: uploadData ? uploadData.path : storagePath,
  };
};

const createSignedUrl = async (storagePath, expiresInSeconds = SIGNED_URL_TTL_SECONDS) => {
  const normalizedPath = String(storagePath || '').replace(/^documents\//, '');
  const { data, error } = await getSupabaseStorage()
    .storage
    .from(BUCKET_NAME)
    .createSignedUrl(normalizedPath, expiresInSeconds);

  if (error) {
    const err = new Error(`Không thể tạo signed URL: ${error.message}`);
    err.isOperational = true;
    throw err;
  }

  return data.signedUrl;
};

const deleteFile = async storagePath => {
  const { error } = await getSupabaseStorage().storage.from(BUCKET_NAME).remove([storagePath]);

  if (error) {
    logger.warn({ err: error, storagePath }, 'Failed to delete storage file');
  }
};

module.exports = { uploadFile, deleteFile, slugifyFileName, createSignedUrl };
