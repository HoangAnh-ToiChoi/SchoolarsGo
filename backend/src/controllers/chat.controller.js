const { chat, saveMessages, getHistory } = require('../services/chat.service');
const { success } = require('../utils/responseHelper');

const sendMessage = async (req, res, next) => {
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

    const reply = await chat(messages);

    // Lưu cặp (user message cuối + assistant reply) vào DB — fire-and-forget
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      saveMessages(req.user?.id, lastUserMsg.content, reply);
    }

    return success(res, { reply });
  } catch (error) {
    next(error);
  }
};

const getChatHistory = async (req, res, next) => {
  try {
    const history = await getHistory(req.user.id);
    return success(res, { messages: history });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getChatHistory };
