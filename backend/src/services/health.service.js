import healthModel from '~/models/health.model.js';
import withTimeout from '~/utils/withTimeout.js';
import { HEALTH_DB_TIMEOUT_MS } from '~/constants/health.js';
import { health as healthErrors } from '~/constants/errors.js';

class HealthService {
  // Trước đây luôn trả ok kể cả khi mất DB (R34): Railway coi bản deploy hỏng là khỏe.
  // DB lỗi là kết quả cần báo (503), không phải lỗi của request, nên bắt lại ở đây
  async check() {
    try {
      await withTimeout(healthModel.ping(), HEALTH_DB_TIMEOUT_MS, healthErrors.DB_TIMEOUT);
      return { ok: true, db: 'ok' };
    } catch {
      return { ok: false, db: 'down' };
    }
  }
}

export default new HealthService();
