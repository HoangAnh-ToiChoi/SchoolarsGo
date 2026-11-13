const NewsService = require('../services/news.service');
const NewsController = require('../controllers/news.controller');
const chatService = require('../services/chat.service');
const ChatController = require('../controllers/chat.controller');
const bindControllerMethods = require('./bindControllerMethods');

const newsService = new NewsService();
const newsController = bindControllerMethods(new NewsController(newsService));
const chatController = bindControllerMethods(new ChatController(chatService));

module.exports = { chatController, newsService, newsController };
