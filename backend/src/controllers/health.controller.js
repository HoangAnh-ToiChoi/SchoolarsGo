import healthService from '~/services/health.service.js';
import { health as healthErrors } from '~/constants/errors.js';

class HealthController {
  // Railway chỉ xem mã HTTP: 200 khi DB trả lời, 503 khi không. Không trả chi tiết lỗi DB (endpoint công khai)
  async check(req, res) {
    const result = await healthService.check();
    const { statusCode, code, message } = healthErrors.DB_DOWN;
    if (!result.ok) return res.error({ statusCode, code: statusCode, errorCode: code, message });
    return res.success({ status: 'ok', db: result.db, timestamp: new Date().toISOString() });
  }
}

export default new HealthController();
