const NOTIFICATION_COLUMNS =
  'id, type, milestone, application_id, read_at, created_at, scholarships(id, slug, title, provider, deadline), applications(status)';

class NotificationRepository {
  #sb;

  constructor(sb) {
    this.#sb = sb;
  }

  /**
   * Học bổng đã lưu có hạn nộp trong [fromDate, toDate).
   * userId = null: lấy cho mọi người dùng (job chạy hằng ngày).
   */
  async findSavedDueBetween(fromDate, toDate, userId = null) {
    let q = this.#sb
      .from('saved_scholarships')
      .select('user_id, scholarship_id, scholarships!inner(deadline)')
      .gte('scholarships.deadline', fromDate)
      .lt('scholarships.deadline', toDate);
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(r => ({
      user_id: r.user_id,
      scholarship_id: r.scholarship_id,
      application_id: null,
      deadline: r.scholarships.deadline,
    }));
  }

  /** Đơn còn nháp (chưa nộp) có hạn nộp trong [fromDate, toDate). */
  async findDraftApplicationsDueBetween(fromDate, toDate, userId = null) {
    let q = this.#sb
      .from('applications')
      .select('id, user_id, scholarship_id, scholarships!inner(deadline)')
      .eq('status', 'draft')
      .gte('scholarships.deadline', fromDate)
      .lt('scholarships.deadline', toDate);
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(r => ({
      user_id: r.user_id,
      scholarship_id: r.scholarship_id,
      application_id: r.id,
      deadline: r.scholarships.deadline,
    }));
  }

  /** Thêm thông báo; bản ghi đã có (cùng người, loại, học bổng, mốc) thì bỏ qua. */
  async insertIgnoreDuplicates(rows) {
    if (rows.length === 0) return;
    const { error } = await this.#sb
      .from('notifications')
      .upsert(rows, { onConflict: 'user_id,type,scholarship_id,milestone', ignoreDuplicates: true });
    if (error) throw error;
  }

  async findByUser(userId, limit) {
    const { data, error } = await this.#sb
      .from('notifications')
      .select(NOTIFICATION_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  /** Đánh dấu đã đọc một thông báo của chính người dùng. Trả về false nếu không có thông báo đó. */
  async markRead(userId, notificationId) {
    const { data, error } = await this.#sb
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select('id, read_at');
    if (error) throw error;
    return (data || []).length > 0;
  }

  /** Đánh dấu tất cả thông báo chưa đọc. Trả về số thông báo vừa đánh dấu. */
  async markAllRead(userId) {
    const { data, error } = await this.#sb
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
      .select('id');
    if (error) throw error;
    return (data || []).length;
  }
}

module.exports = NotificationRepository;
