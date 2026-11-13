const getSupabase = require('../config/supabase');
const db = require('../config/database.config');
const eventBus = require('../events/eventBus');
const HashService = require('../services/hash.service');
const TokenService = require('../services/token.service');
const SessionRepository = require('../repositories/session.repository');
const SessionService = require('../services/session.service');
const AuthRepository = require('../repositories/auth.repository');
const { createIngestion } = require('../ingestion');

const supabase = getSupabase();
const hashService = new HashService();
const tokenService = new TokenService();
const sessionRepository = new SessionRepository(db);
const authRepo = new AuthRepository(supabase);
const sessionService = new SessionService(sessionRepository, authRepo, tokenService);

const ingestionAiModel = createIngestionAiModel();
const ingestionService = createIngestion({ db, aiModel: ingestionAiModel });

function createIngestionAiModel() {
  if (process.env.INGESTION_USE_AI === 'false' || !process.env.GEMINI_API_KEY) return null;

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  return client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  });
}

module.exports = {
  authRepo,
  eventBus,
  hashService,
  ingestionService,
  sessionRepository,
  sessionService,
  tokenService,
  db,
  supabase,
};
