import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', authController.refresh);

export default router;
