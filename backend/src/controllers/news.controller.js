const newsService = require('../services/news.service');
const { success } = require('../utils/responseHelper');

const getNews = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const category = req.query.category || null;

    let news = await newsService.getNews(50);
    if (category) news = news.filter((n) => n.category === category);

    return success(res, news.slice(0, limit));
  } catch (error) {
    next(error);
  }
};

module.exports = { getNews };
