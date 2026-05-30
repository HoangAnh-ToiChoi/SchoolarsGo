const { success } = require('../utils/responseHelper');

class NewsController {
  #service;

  constructor(newsService) {
    this.#service = newsService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#service) throw new Error('NewsService is required');
  }

  getNews = async (req, res, next) => {
    try {
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const category = req.query.category || null;
      const news = await this.#service.getNews(limit, category);
      return success(res, news);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = NewsController;
