const { Router } = require('express');
const NewsController = require('../controllers/news.controller');
const bindControllerMethods = require('../utils/bindControllerMethods');
const newsController = bindControllerMethods(new NewsController());

const router = Router();

router.get('/', newsController.getNews);

module.exports = router;
