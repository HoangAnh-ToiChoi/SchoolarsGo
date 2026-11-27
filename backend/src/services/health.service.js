import healthModel from '~/models/health.model.js';
import withTimeout from '~/utils/withTimeout.js';
import { HEALTH_DB_TIMEOUT_MS, HEALTH_CACHE_MS } from '~/constants/health.js';
import { health as healthErrors } from '~/constants/errors.js';

class HealthService {
  // Endpoint công khai, không qua rate limit: giữ kết quả vài giây và gộp các lần gọi trùng lúc,
  // để gọi dồn không chiếm hết kết nối pool DB của các API khác
  #cached = null;
  #pending = null;

  async check() {
    const fresh = this.#cached && Date.now() - this.#cached.at < HEALTH_CACHE_MS;
    if (fresh) return this.#cached.result;
    this.#pending ??= this.#probe();
    return this.#pending;
  }

  // Trước đây luôn trả ok kể cả khi mất DB (R34): Railway coi bản deploy hỏng là khỏe.
  // DB lỗi là kết quả cần báo (503), không phải lỗi của request, nên bắt lại ở đây
  async #probe() {
    let result;
    try {
      await withTimeout(healthModel.ping(), HEALTH_DB_TIMEOUT_MS, healthErrors.DB_TIMEOUT);
      result = { ok: true, db: 'ok' };
    } catch {
      result = { ok: false, db: 'down' };
    }
    this.#cached = { at: Date.now(), result };
    this.#pending = null;
    return result;
  }
}

export default new HealthService();
