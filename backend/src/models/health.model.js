import { query } from '~/configs/database.config.js';

class HealthModel {
  async ping() {
    await query('SELECT 1');
  }
}

export default new HealthModel();
