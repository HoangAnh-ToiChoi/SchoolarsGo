import recommendService from '~/services/recommend.service.js';

class RecommendController {
  async recommend(req, res) {
    const data = await recommendService.recommend(req.user.id, req.body.top_n);
    return res.success(data);
  }
}

export default new RecommendController();