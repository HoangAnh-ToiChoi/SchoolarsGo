const { eventBus, supabase } = require('./core');
const ProfileRepository = require('../repositories/profile.repository');
const ProfileService = require('../services/profile.service');
const ProfileController = require('../controllers/profile.controller');
const ApplicationRepository = require('../repositories/application.repository');
const ApplicationService = require('../services/application.service');
const ApplicationController = require('../controllers/application.controller');
const DocumentRepository = require('../repositories/document.repository');
const DocumentService = require('../services/document.service');
const DocumentController = require('../controllers/document.controller');
const storageService = require('../services/storage.service');
const SavedRepository = require('../repositories/saved.repository');
const SavedService = require('../services/saved.service');
const SavedController = require('../controllers/saved.controller');
const NotificationRepository = require('../repositories/notification.repository');
const NotificationService = require('../services/notification.service');
const NotificationController = require('../controllers/notification.controller');
const bindControllerMethods = require('./bindControllerMethods');

const profileRepo = new ProfileRepository(supabase);
const profileService = new ProfileService(profileRepo);
const profileController = bindControllerMethods(new ProfileController(profileService));

const applicationRepo = new ApplicationRepository(supabase);
const applicationService = new ApplicationService(applicationRepo);
const applicationController = bindControllerMethods(new ApplicationController(applicationService));

const documentRepo = new DocumentRepository(supabase);
const documentService = new DocumentService(documentRepo, eventBus, storageService);
const documentController = bindControllerMethods(new DocumentController(documentService));

const savedRepo = new SavedRepository(supabase);
const savedService = new SavedService(savedRepo);
const savedController = bindControllerMethods(new SavedController(savedService));

const notificationRepo = new NotificationRepository(supabase);
const notificationService = new NotificationService(notificationRepo);
const notificationController = bindControllerMethods(new NotificationController(notificationService));

module.exports = {
  applicationService,
  applicationController,
  documentRepo,
  documentService,
  documentController,
  notificationService,
  notificationController,
  profileRepo,
  profileService,
  profileController,
  savedService,
  savedController,
};
