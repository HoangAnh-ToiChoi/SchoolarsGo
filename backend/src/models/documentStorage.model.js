import getSupabase from '~/configs/supabase.js';
import { DOCUMENT_BUCKET, DOCUMENT_SIGNED_URL_TTL_SECONDS } from '~/constants/document.js';

// Supabase Storage, bucket private "documents" (đường dẫn {user_id}/{type}/{tên-file}). Client service role vượt RLS của Storage.
// Không có URL công khai: người dùng tải file qua link ký có hạn.
class DocumentStorageModel {
  #bucket() {
    return getSupabase().storage.from(DOCUMENT_BUCKET);
  }

  /** contentType là loại đã kiểm từ byte đầu, không phải MIME client gửi. Trả đường dẫn trong bucket. */
  async upload(storagePath, buffer, contentType) {
    const { data, error } = await this.#bucket().upload(storagePath, buffer, { contentType, upsert: false });
    if (error) throw error;
    return data.path;
  }

  async remove(storagePath) {
    const { error } = await this.#bucket().remove([storagePath]);
    if (error) throw error;
  }

  /** Trả Map đường dẫn → link ký (file không còn trên Storage thì không có trong Map). */
  async createSignedUrls(storagePaths) {
    const { data, error } = await this.#bucket().createSignedUrls(storagePaths, DOCUMENT_SIGNED_URL_TTL_SECONDS);
    if (error) throw error;
    const signed = data.filter((item) => item.signedUrl);
    return new Map(signed.map((item) => [item.path, item.signedUrl]));
  }
}

export default new DocumentStorageModel();
