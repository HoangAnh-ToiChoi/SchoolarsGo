const { supabase } = require('./core');
const ScholarshipRepository = require('../repositories/scholarship.repository');
const ScholarshipService = require('../services/scholarship.service');
const ScholarshipController = require('../controllers/scholarship.controller');
const RecommendRepository = require('../repositories/recommend.repository');
const RecommendService = require('../services/recommend.service');
const RecommendController = require('../controllers/recommend.controller');
const geminiService = require('../services/gemini.service');
const bindControllerMethods = require('./bindControllerMethods');

const scholarshipRepo = new ScholarshipRepository(supabase);
const scholarshipService = new ScholarshipService(scholarshipRepo);
const scholarshipController = bindControllerMethods(new ScholarshipController(scholarshipService));

const recommendRepo = new RecommendRepository(supabase);
const recommendService = new RecommendService(recommendRepo, geminiService);
const recommendController = bindControllerMethods(new RecommendController(recommendService));

module.exports = {
  recommendRepo,
  recommendService,
  recommendController,
  scholarshipRepo,
  scholarshipService,
  scholarshipController,
};
