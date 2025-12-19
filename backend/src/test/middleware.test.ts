import request from 'supertest';
import express from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';
import { AuthService } from '../services/AuthService';

// Create a test app
const testApp = express();
testApp.use(express.json());

// Test routes
testApp.get('/protected', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

testApp.get('/admin-only', authenticate, requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Admin access granted' });
});

describe('Authentication Middleware', () => {
  let userToken: string;
  let adminToken: string;
  const authService = new AuthService();

  beforeAll(() => {
    // Create mock tokens for testing
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed',
      role: 'user' as const,
      wallet_limit: 1,
      created_at: new Date(),
      updated_at: new Date()
    };

    const mockAdmin = {
      ...mockUser,
      id: 'admin-123',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin' as const
    };

    userToken = authService.generateToken(mockUser);
    adminToken = authService.generateToken(mockAdmin);
  });

  describe('authenticate middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(testApp)
        .get('/protected')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.userId).toBe('user-123');
    });

    it('should deny access without token', async () => {
      const response = await request(testApp)
        .get('/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(testApp)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_INVALID');
    });
  });

  describe('requireAdmin middleware', () => {
    it('should allow admin access', async () => {
      const response = await request(testApp)
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin access granted');
    });

    it('should deny non-admin access', async () => {
      const response = await request(testApp)
        .get('/admin-only')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });
  });
});