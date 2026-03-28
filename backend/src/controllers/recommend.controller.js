const recommendService = require('../services/recommend.service');
const { success } = require('../utils/responseHelper');

const recommend = async (req, res, next) => {
  try {
    const data = await recommendService.recommend(req.user.id, req.body.top_n);
    return success(res, data);
  } catch (error) {
    next(error);
  }
};

module.exports = { recommend };
