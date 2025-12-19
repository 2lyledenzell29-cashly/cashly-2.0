import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { JWTPayload, ApiResponse } from '../types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // JWT token validation middleware
  authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_MISSING',
            message: 'Authorization header is required'
          }
        } as ApiResponse);
        return;
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_MISSING',
            message: 'JWT token is required'
          }
        } as ApiResponse);
        return;
      }

      const payload = this.authService.verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  // Admin role verification middleware
  requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication required'
        }
      } as ApiResponse);
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required'
        }
      } as ApiResponse);
      return;
    }

    next();
  };

  // Optional authentication middleware (doesn't fail if no token)
  optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const token = authHeader.startsWith('Bearer ') 
          ? authHeader.substring(7) 
          : authHeader;

        if (token) {
          const payload = this.authService.verifyToken(token);
          req.user = payload;
        }
      }

      next();
    } catch (error) {
      // For optional auth, we don't fail on token errors
      // Just continue without setting req.user
      next();
    }
  };

  // Prevent self-modification of admin status
  preventSelfAdminModification = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication required'
        }
      } as ApiResponse);
      return;
    }

    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    // If admin is trying to modify their own role, prevent it
    if (targetUserId === currentUserId && req.body.role) {
      res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_CANNOT_MODIFY_SELF_ROLE',
          message: 'Cannot modify your own role'
        }
      } as ApiResponse);
      return;
    }

    next();
  };

  // Validate admin permissions with detailed logging
  validateAdminAccess = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      console.warn('Unauthorized access attempt to admin endpoint:', req.path);
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication required'
        }
      } as ApiResponse);
      return;
    }

    if (req.user.role !== 'admin') {
      console.warn(`Non-admin user ${req.user.userId} attempted to access admin endpoint: ${req.path}`);
      res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: 'Administrative privileges required'
        }
      } as ApiResponse);
      return;
    }

    // Log admin actions for audit trail
    console.log(`Admin ${req.user.userId} accessing: ${req.method} ${req.path}`);
    next();
  };

  private handleAuthError(error: any, res: Response): void {
    const errorMessage = error.message || 'INTERNAL_SERVER_ERROR';

    switch (errorMessage) {
      case 'AUTH_TOKEN_EXPIRED':
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_EXPIRED',
            message: 'JWT token has expired'
          }
        } as ApiResponse);
        break;

      case 'AUTH_TOKEN_INVALID':
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid JWT token'
          }
        } as ApiResponse);
        break;

      default:
        console.error('Auth middleware error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        } as ApiResponse);
        break;
    }
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
export const authenticate = authMiddleware.authenticate;
export const requireAdmin = authMiddleware.requireAdmin;
export const optionalAuth = authMiddleware.optionalAuth;
export const preventSelfAdminModification = authMiddleware.preventSelfAdminModification;
export const validateAdminAccess = authMiddleware.validateAdminAccess;