import * as chatService from '~/services/chat.service.js';

class ChatController {
  async sendMessage(req, res) {
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

    const reply = await chatService.chat(messages, { userId: req.user?.id });

    // Lưu cặp (user message cuối + assistant reply) vào DB — fire-and-forget
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      chatService.saveMessages(req.user?.id, lastUserMsg.content, reply);
    }

    return res.success({ reply });
  }

  async getChatHistory(req, res) {
    const history = await chatService.getHistory(req.user.id);
    return res.success({ messages: history });
  }
}

export default new ChatController();