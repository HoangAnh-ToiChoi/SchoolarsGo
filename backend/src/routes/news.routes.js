const { Router } = require('express');
const newsController = require('../controllers/news.controller');

const router = Router();

router.get('/', newsController.getNews);

module.exports = router;
