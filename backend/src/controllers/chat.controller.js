const { success } = require('../utils/responseHelper');

class ChatController {
  #chatService;

  /**
   * @param {object} chatService - { chat, saveMessages, getHistory }
   */
  constructor(chatService) {
    this.#chatService = chatService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#chatService) throw new Error('ChatService is required');
  }

  sendMessage = async (req, res, next) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        const err = new Error('messages là bắt buộc và phải là array');
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
      }

      const isValid = messages.every(
        (m) => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim().length > 0
      );
      if (!isValid) {
        const err = new Error('Mỗi message phải có role (user/assistant) và content là chuỗi không rỗng');
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
      }

      const lastMsg = messages[messages.length - 1];
      if (lastMsg.content.length > 1000) {
        const err = new Error('Tin nhắn không được vượt quá 1000 ký tự');
        err.statusCode = 400;
        err.isOperational = true;
        throw err;
      }

      const reply = await this.#chatService.chat(messages);

      // Lưu cặp (user message cuối + assistant reply) vào DB — fire-and-forget
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        this.#chatService.saveMessages(req.user?.id, lastUserMsg.content, reply);
      }

      return success(res, { reply });
    } catch (error) {
      next(error);
    }
  };

  getChatHistory = async (req, res, next) => {
    try {
      const history = await this.#chatService.getHistory(req.user.id);
      return success(res, { messages: history });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ChatController;
