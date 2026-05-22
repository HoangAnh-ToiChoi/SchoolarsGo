const { success } = require('../utils/responseHelper');

class RecommendController {
  #service;

  constructor(recommendService) {
    this.#service = recommendService;
    this.#validateService();
  }

  #validateService() {
    if (!this.#service) throw new Error('RecommendService is required');
  }

  recommend = async (req, res, next) => {
    try {
      const data = await this.#service.recommend(req.user.id, req.body.top_n);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = RecommendController;
