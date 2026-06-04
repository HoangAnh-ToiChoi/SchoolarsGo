/**
 * auth.listener.js — Listener xử lý auth events
 *
 * Lắng nghe các event liên quan đến Auth:
 * - user.registered  → gửi email welcome, log analytics
 * - user.login       → log security audit
 */

const eventBus = require('../eventBus');
const logger = require('../../utils/logger');

const registerAuthListeners = () => {
  // ── user.registered ────────────────────────────────────────
  eventBus.on('user.registered', async payload => {
    try {
      const { userId, email, fullName, role } = payload;
      logger.info({ userId, email, fullName, role }, 'New user registered');
      // TODO: Gửi email welcome
      // TODO: Log analytics (ví dụ: GA, Mixpanel)
    } catch (err) {
      logger.error({ err }, 'Error handling user.registered');
    }
  });

  // ── user.login ─────────────────────────────────────────────
  eventBus.on('user.login', async payload => {
    try {
      const { userId, email, role } = payload;
      logger.info({ userId, email, role }, 'User logged in');
      // TODO: Log security audit trail
    } catch (err) {
      logger.error({ err }, 'Error handling user.login');
    }
  });
};

module.exports = { registerAuthListeners };
