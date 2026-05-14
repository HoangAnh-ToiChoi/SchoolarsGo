const chatService = require('../services/chat.service');
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

    const reply = await chatService.chat(messages);
    return success(res, { reply });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage };
