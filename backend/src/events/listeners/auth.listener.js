/**
 * auth.listener.js — Listener xử lý auth events
 *
 * Lắng nghe các event liên quan đến Auth:
 * - user.registered  → gửi email welcome, log analytics
 * - user.login       → log security audit
 */

const eventBus = require('../eventBus');

const registerAuthListeners = () => {
  // ── user.registered ────────────────────────────────────────
  eventBus.on('user.registered', async (payload) => {
    try {
      const { userId, email, fullName, role } = payload;
      console.log(
        `[AUTH EVENT] New user registered → ${email} ` +
        `(${fullName}, role: ${role}, id: ${userId})`
      );
      // TODO: Gửi email welcome
      // TODO: Log analytics (ví dụ: GA, Mixpanel)
    } catch (err) {
      console.error('[AUTH LISTENER] Error handling user.registered:', err.message);
    }
  });

  // ── user.login ─────────────────────────────────────────────
  eventBus.on('user.login', async (payload) => {
    try {
      const { userId, email, role } = payload;
      console.log(
        `[AUTH EVENT] User logged in → ${email} ` +
        `(role: ${role}, id: ${userId})`
      );
      // TODO: Log security audit trail
    } catch (err) {
      console.error('[AUTH LISTENER] Error handling user.login:', err.message);
    }
  });
};

module.exports = { registerAuthListeners };
