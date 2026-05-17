const BaseRepository = require('./base.repository');

class DocumentRepository extends BaseRepository {
  #db;

  constructor(db) {
    super(db, 'documents');
    this.#db = db;
  }

  #query(sql, params) {
    return this.#db.query(sql, params);
  }

  #queryOne(sql, params) {
    return this.#db.queryOne(sql, params);
  }

  async findAllByUserId(userId) {
    const result = await this.#query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async findByIdAndUserId(id, userId) {
    return this.#queryOne(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }

  async insertDocument({ userId, docType, fileName, fileUrl, fileSize, mimeType }) {
    return this.#queryOne(
      `INSERT INTO documents (user_id, type, file_name, file_url, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, docType, fileName, fileUrl, fileSize, mimeType]
    );
  }

  async deleteByIdAndUserId(id, userId) {
    const doc = await this.#queryOne(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!doc) return null;

    const storagePath = this.#extractStoragePath(doc.file_url);
    await this.#query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
    return storagePath;
  }

  #extractStoragePath(publicUrl) {
    if (!publicUrl) return null;
    const match = publicUrl.match(/\/documents\/(.+)/);
    return match ? `documents/${match[1]}` : null;
  }
}

module.exports = DocumentRepository;
