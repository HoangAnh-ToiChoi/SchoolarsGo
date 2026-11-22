/**
 * ScholarsGo Route Definitions
 * Centralized mapping for all application routes (R6 compliant)
 */

export const ROUTES = Object.freeze({
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgotPassword',
  resetPassword: '/resetPassword',
  saved: '/saved',
  compare: '/compare',
  news: '/news',
  dashboard: '/dashboard',
  profile: '/dashboard',
  applications: '/applications',
  applicationDetail: (id) => (id ? `/applications/${id}` : '/applications'),
  deadlines: '/deadlines',
  recommend: '/recommend',
  chat: '/chat',
  scholarships: '/scholarships',
  scholarshipDetail: (itemOrSlug) => {
    if (!itemOrSlug) return '/scholarships';
    if (typeof itemOrSlug === 'object') {
      return `/scholarships/${itemOrSlug.slug || itemOrSlug.id}`;
    }
    return `/scholarships/${itemOrSlug}`;
  },
  admin: Object.freeze({
    dashboard: '/admin',
    users: '/admin/users',
    scholarships: '/admin/scholarships',
  }),
});
