const { authRepo, eventBus, hashService, sessionService, tokenService } = require('./core');
const AuthService = require('../services/auth.service');
const AuthController = require('../controllers/auth.controller');
const bindControllerMethods = require('./bindControllerMethods');

const authService = new AuthService(authRepo, eventBus, hashService, tokenService, sessionService);
const authController = bindControllerMethods(new AuthController(authService));

module.exports = { authService, authController };
