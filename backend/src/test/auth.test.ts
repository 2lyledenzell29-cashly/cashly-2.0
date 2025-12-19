import request from 'supertest';
import app from '../index';

describe('Authentication Endpoints', () => {
  const timestamp = Date.now();
  const testUser = {
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should fail with weak password', async () => {
      const weakPasswordUser = {
        ...testUser,
        username: `testuser2${timestamp}`,
        email: `test2${timestamp}@example.com`,
        password: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_PASSWORD_WEAK');
    });

    it('should fail with password mismatch', async () => {
      const mismatchUser = {
        ...testUser,
        username: `testuser3${timestamp}`,
        email: `test3${timestamp}@example.com`,
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(mismatchUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_PASSWORD_MISMATCH');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });
});