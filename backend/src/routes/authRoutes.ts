import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', authController.refresh);

// GET /api/auth/me - Get current user
router.get('/me', authenticate, authController.me);

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticate, authController.updateProfile);

// PUT /api/auth/change-password - Change user password
router.put('/change-password', authenticate, authController.changePassword);

export default router;
