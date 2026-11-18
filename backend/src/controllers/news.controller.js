import newsService from '~/services/news.service.js';

class NewsController {
  async getNews(req, res) {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const category = req.query.category || null;
    const news = await newsService.getNews(limit, category);
    return res.success(news);
  }
}

export default new NewsController();