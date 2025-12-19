import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { RegisterRequest, LoginRequest, ApiResponse } from '../types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData: RegisterRequest = req.body;

      // Basic validation
      if (!registerData.username || !registerData.email || !registerData.password || !registerData.confirmPassword) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'All fields are required: username, email, password, confirmPassword'
          }
        } as ApiResponse);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerData.email)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid email format'
          }
        } as ApiResponse);
        return;
      }

      // Validate username (alphanumeric and underscores only, 3-30 characters)
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(registerData.username)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores'
          }
        } as ApiResponse);
        return;
      }

      const result = await this.authService.register(registerData);

      res.status(201).json({
        success: true,
        data: result
      } as ApiResponse);
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;

      // Basic validation
      if (!loginData.emailOrUsername || !loginData.password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Email/username and password are required'
          }
        } as ApiResponse);
        return;
      }

      const result = await this.authService.login(loginData);

      res.status(200).json({
        success: true,
        data: result
      } as ApiResponse);
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Token is required'
          }
        } as ApiResponse);
        return;
      }

      const result = await this.authService.refreshToken(token);

      res.status(200).json({
        success: true,
        data: result
      } as ApiResponse);
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
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

      const user = await this.authService.getCurrentUser(req.user.userId);

      res.status(200).json({
        success: true,
        data: user
      } as ApiResponse);
    } catch (error) {
      this.handleAuthError(error, res);
    }
  };

  private handleAuthError(error: any, res: Response): void {
    const errorMessage = error.message || 'INTERNAL_SERVER_ERROR';

    switch (errorMessage) {
      case 'VALIDATION_PASSWORD_MISMATCH':
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_PASSWORD_MISMATCH',
            message: 'Password confirmation does not match'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_PASSWORD_WEAK':
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_PASSWORD_WEAK',
            message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
          }
        } as ApiResponse);
        break;

      case 'USER_EMAIL_EXISTS':
        res.status(409).json({
          success: false,
          error: {
            code: 'USER_EMAIL_EXISTS',
            message: 'An account with this email already exists'
          }
        } as ApiResponse);
        break;

      case 'USER_USERNAME_EXISTS':
        res.status(409).json({
          success: false,
          error: {
            code: 'USER_USERNAME_EXISTS',
            message: 'This username is already taken'
          }
        } as ApiResponse);
        break;

      case 'AUTH_INVALID_CREDENTIALS':
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_INVALID_CREDENTIALS',
            message: 'Invalid email/username or password'
          }
        } as ApiResponse);
        break;

      case 'USER_CREATION_FAILED':
        res.status(500).json({
          success: false,
          error: {
            code: 'USER_CREATION_FAILED',
            message: 'Failed to create user account'
          }
        } as ApiResponse);
        break;

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

      case 'USER_NOT_FOUND':
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        } as ApiResponse);
        break;

      default:
        console.error('Auth error:', error);
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