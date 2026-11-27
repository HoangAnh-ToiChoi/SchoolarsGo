import healthService from '~/services/health.service.js';

class HealthController {
  // Không trả chi tiết lỗi DB: endpoint công khai
  async check(req, res) {
    const result = await healthService.check();
    const body = { success: result.ok, status: result.ok ? 'ok' : 'degraded', db: result.db, timestamp: new Date().toISOString() };
    return res.status(result.ok ? 200 : 503).json(body);
  }
}

export default new HealthController();
