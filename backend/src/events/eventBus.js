/**
 * eventBus.js — Singleton EventEmitter
 *
 * Dùng EventEmitter mặc định của Node.js.
 * Export một instance DUY NHẤT — require ở bất kỳ đâu đều cùng object.
 *
 * Pattern: Loose Coupling
 * - Publisher (Service) chỉ emit, không biết ai lắng nghe
 * - Listener chỉ lắng nghe, không biết ai emit
 * - Nối dây tập trung tại container.js
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);

    this.on('error', (error, context) => {
      logger.error({ err: error, context }, 'EventBus error');
    });
  }
}

module.exports = new EventBus();
