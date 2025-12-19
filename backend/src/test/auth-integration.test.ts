import request from 'supertest';
import app from '../index';
import { UserRepository } from '../repositories/UserRepository';

describe('Authentication Integration Tests', () => {
  let userRepository: UserRepository;
  let testUserId: string;

  beforeAll(() => {
    userRepository = new UserRepository();
  });

  afterEach(async () => {
    // Clean up test user if created
    if (testUserId) {
      try {
        await userRepository.delete(testUserId);
      } catch (error) {
        // Ignore cleanup errors
      }
      testUserId = '';
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const timestamp = Date.now();
      const userData = {
        username: `testuser${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user).not.toHaveProperty('password_hash');

      testUserId = response.body.data.user.id;
    });

    it('should reject registration with weak password', async () => {
      const timestamp = Date.now();
      const userData = {
        username: `testuser${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_PASSWORD_WEAK');
    });

    it('should reject registration with mismatched passwords', async () => {
      const timestamp = Date.now();
      const userData = {
        username: `testuser${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_PASSWORD_MISMATCH');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUserData: any;

    beforeEach(async () => {
      // Create a test user for login tests
      const timestamp = Date.now();
      testUserData = {
        username: `logintest${timestamp}`,
        email: `login${timestamp}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData);

      testUserId = response.body.data.user.id;
    });

    it('should login with email successfully', async () => {
      const loginData = {
        emailOrUsername: testUserData.email,
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUserData.email);
    });

    it('should login with username successfully', async () => {
      const loginData = {
        emailOrUsername: testUserData.username,
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.username).toBe(testUserData.username);
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        emailOrUsername: testUserData.email,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create and login a test user
      const timestamp = Date.now();
      const userData = {
        username: `metest${timestamp}`,
        email: `me${timestamp}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      testUserId = registerResponse.body.data.user.id;
      authToken = registerResponse.body.data.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('password_hash');
      expect(response.body.data.email).toContain('@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_INVALID');
    });
  });

  describe('Protected Route Access', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create and login a test user
      const timestamp = Date.now();
      const userData = {
        username: `protectedtest${timestamp}`,
        email: `protected${timestamp}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      testUserId = registerResponse.body.data.user.id;
      authToken = registerResponse.body.data.token;
    });

    it('should allow access to protected routes with valid token', async () => {
      const response = await request(app)
        .get('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny access to protected routes without token', async () => {
      const response = await request(app)
        .get('/api/wallets')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });
  });
});