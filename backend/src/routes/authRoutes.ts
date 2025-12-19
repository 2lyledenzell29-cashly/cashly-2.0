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

export default router;
