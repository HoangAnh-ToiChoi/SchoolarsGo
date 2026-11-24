import chatService from '~/services/chat.service.js';

class ChatController {
  async sendMessage(req, res) {
    const reply = await chatService.reply(req.body.messages, req.user.id);
    return res.success({ reply });
  }

  async getChatHistory(req, res) {
    const history = await chatService.getHistory(req.user.id);
    return res.success({ messages: history });
  }
}

export default new ChatController();
