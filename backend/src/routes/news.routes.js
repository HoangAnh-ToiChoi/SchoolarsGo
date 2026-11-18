import { Router } from 'express';
import newsController from '~/controllers/news.controller.js';

const router = Router();

router.get('/', newsController.getNews);

export default router;