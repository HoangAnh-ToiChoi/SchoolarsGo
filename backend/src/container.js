const shared = require('./container/core');
const auth = require('./container/auth');
const admin = require('./container/admin');
const catalog = require('./container/catalog');
const content = require('./container/content');
const users = require('./container/users');

module.exports = {
  ...auth,
  ...admin,
  ...catalog,
  ...content,
  ...users,
  authRepo: shared.authRepo,
  sessionRepository: shared.sessionRepository,
  sessionService: shared.sessionService,
  tokenService: shared.tokenService,
  ingestionService: shared.ingestionService,
};
