/**
 * DocumentRepository — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Lớp này CHỨA TOÀN BỘ SQL của module Documents.
 * KHÔNG viết SQL ở bất kỳ tầng nào khác (Service/Controller).
 *
 * Public methods — Service gọi:
 *   findAllByUserId(userId)              → documents[]
 *   findByIdAndUserId(id, userId)        → document hoặc null
 *   insertDocument(doc)                  → document vừa insert
 *   deleteByIdAndUserId(id, userId)     → storage_path (string) để service xóa file vật lý
 *
 * Private helpers — nội bộ:
 *   #extractStoragePath(publicUrl)        → 'documents/...' hoặc null
 */
const BaseRepository = require('./base.repository');

class DocumentRepository extends BaseRepository {
  constructor(db) {
    super(db, 'documents');
  }

  // ─── PUBLIC — Service gọi ────────────────────────────────────────────────

  /**
   * Lấy tất cả documents của user
   */
  async findAllByUserId(userId) {
    const result = await this.db.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  /**
   * Tìm document theo id + user_id (ownership check)
   * Dùng khi cần kiểm tra tồn tại trước khi xóa.
   */
  async findByIdAndUserId(id, userId) {
    return this.db.queryOne(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }

  /**
   * Insert document metadata vào DB
   */
  async insertDocument({ userId, docType, fileName, fileUrl, fileSize, mimeType }) {
    return this.db.queryOne(
      `INSERT INTO documents (user_id, type, file_name, file_url, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, docType, fileName, fileUrl, fileSize, mimeType]
    );
  }

  /**
   * Xóa document record trong DB
   * Trả về storage_path để Service xóa file vật lý trên Supabase Storage.
   */
  async deleteByIdAndUserId(id, userId) {
    const doc = await this.db.queryOne(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!doc) return null;

    const storagePath = this.#extractStoragePath(doc.file_url);

    await this.db.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    return storagePath;
  }

  // ─── PRIVATE ─────────────────────────────────────────────────────────────

  /**
   * Trích xuất storage path từ public URL của Supabase Storage
   * URL ví dụ: https://xxx.supabase.co/storage/v1/object/public/documents/uuid/cv/xxx.pdf
   * → Trả về: documents/uuid/cv/xxx.pdf
   */
  #extractStoragePath(publicUrl) {
    if (!publicUrl) return null;
    const match = publicUrl.match(/\/documents\/(.+)/);
    return match ? `documents/${match[1]}` : null;
  }
}

module.exports = DocumentRepository;
