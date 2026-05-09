/**
 * RecommendController — VÙNG 2 (Controller → Service)
 *
 * Quy tắc:
 * - Class với arrow functions để giữ `this`
 * - Import Service từ container
 * - Hứng lỗi bằng try/catch, đẩy qua next(error)
 */
const { success } = require('../utils/responseHelper');

class RecommendController {
  constructor(recommendService) {
    this.recommendService = recommendService;
  }

  /**
   * POST /api/recommend
   * @desc Get scholarship recommendations based on user profile
   */
  recommend = async (req, res, next) => {
    try {
      const data = await this.recommendService.recommend(req.user.id, req.body.top_n);
      return success(res, data);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = RecommendController;
