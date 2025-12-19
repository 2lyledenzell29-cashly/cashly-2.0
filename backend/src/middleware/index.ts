export { 
  authenticate, 
  requireAdmin, 
  optionalAuth, 
  validateAdminAccess, 
  preventSelfAdminModification 
} from './authMiddleware';
export { adminRateLimit, generalRateLimit } from './rateLimitMiddleware';