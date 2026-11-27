import getSupabase from '~/configs/supabase.js';
import * as database from '~/configs/database.config.js';
import { RECOMMEND_SCHOLARSHIP_COLUMNS } from '~/constants/recommend.js';
import { PROFILE_UPDATABLE_FIELDS } from '~/constants/profile.js';

class RecommendModel {
  async findProfileByUserId(userId) {
    const { data: profile, error: profileError } = await getSupabase()
      .from('profiles')
      .select(PROFILE_UPDATABLE_FIELDS.join(', '))
      .eq('user_id', userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return null;

    const { data: documents, error: documentsError } = await getSupabase()
      .from('documents')
      .select('id, type')
      .eq('user_id', userId);
    if (documentsError) throw documentsError;

    return {
      ...profile,
      document_count: documents?.length || 0,
      document_types: [...new Set((documents || []).map((doc) => doc.type).filter(Boolean))],
    };
  }

  /**
   * Bước 1 (CLAUDE.md 4.10): mọi học bổng còn mở, chỉ các cột service cần để chấm điểm.
   * Qua pg để không bị PostgREST cắt ở 1000 dòng; trước đây chỉ chấm 200 học bổng đầu.
   */
  async findCandidates() {
    const sql = `
      SELECT id, title, provider, country, degree, degree_source, field_of_study, min_gpa, min_ielts, deadline,
             intake, summary, benefits, requirements, eligibility, eligible_nationalities, max_age
      FROM scholarships
      WHERE is_active = true AND (deadline IS NULL OR deadline >= now())
      ORDER BY relevance_score DESC, deadline ASC NULLS LAST -- cùng điểm phù hợp thì giữ thứ tự cũ (sort ổn định)
    `;
    const { rows } = await database.query(sql);
    return rows;
  }

  /** Bước 3: bản ghi hiển thị cho top N, một lần theo danh sách id. */
  async findByIds(ids) {
    if (ids.length === 0) return [];
    const { data, error } = await getSupabase()
      .from('scholarships')
      .select(RECOMMEND_SCHOLARSHIP_COLUMNS)
      .in('id', ids);
    if (error) throw error;
    return data || [];
  }
}

export default new RecommendModel();