const { Router } = require('express');
const { newsController } = require('../container');

const router = Router();

router.get('/', newsController.getNews);

module.exports = router;
