const { db, sessionService } = require('./core');
const AdminRepository = require('../repositories/admin.repository');
const AdminService = require('../services/admin.service');
const AdminController = require('../controllers/admin.controller');
const bindControllerMethods = require('./bindControllerMethods');

const adminRepo = new AdminRepository(db);
const adminService = new AdminService(adminRepo, sessionService);
const adminController = bindControllerMethods(new AdminController(adminService));

module.exports = { adminRepo, adminService, adminController };
