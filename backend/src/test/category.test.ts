import request from 'supertest';
import app from '../index';
import { CategoryService } from '../services/CategoryService';

describe('Category Management', () => {
  let authToken: string;
  let userId: string;
  const timestamp = Date.now();

  beforeAll(async () => {
    // Register a test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: `categorytest${timestamp}`,
        email: `categorytest${timestamp}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.success).toBe(true);
    
    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;
  });

  describe('Category CRUD Operations', () => {
    it('should create a new category', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Category',
          type: 'Expense'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Category');
      expect(response.body.data.type).toBe('Expense');
      expect(response.body.data.user_id).toBe(userId);
    });

    it('should get user categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter categories by type', async () => {
      // Create an Income category
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Salary',
          type: 'Income'
        });

      const response = await request(app)
        .get('/api/categories?type=Income')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every((cat: any) => cat.type === 'Income')).toBe(true);
    });

    it('should prevent duplicate category names', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Category', // Same name as first test
          type: 'Income'
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CATEGORY_NAME_EXISTS');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name
          type: 'Expense'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
    });

    it('should validate category type', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Type Category',
          type: 'InvalidType'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('Category-Transaction Relationships', () => {
    it('should get uncategorized transactions', async () => {
      const response = await request(app)
        .get('/api/categories/uncategorized/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Category Service', () => {
    it('should validate category ownership', async () => {
      const categoryService = new CategoryService();
      
      // This should return false for non-existent category (using valid UUID format)
      const isOwner = await categoryService.validateCategoryOwnership('550e8400-e29b-41d4-a716-446655440000', userId);
      expect(isOwner).toBe(false);
    });
  });
});