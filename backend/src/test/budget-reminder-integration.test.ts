import request from 'supertest';
import app from '../index';
import { UserRepository } from '../repositories/UserRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { ReminderRepository } from '../repositories/ReminderRepository';

describe('Budget and Reminder Integration Tests', () => {
  let userRepository: UserRepository;
  let walletRepository: WalletRepository;
  let budgetRepository: BudgetRepository;
  let reminderRepository: ReminderRepository;
  let testUserId: string;
  let authToken: string;
  let testWalletId: string;
  let testBudgetId: string;
  let testReminderId: string;

  beforeAll(() => {
    userRepository = new UserRepository();
    walletRepository = new WalletRepository();
    budgetRepository = new BudgetRepository();
    reminderRepository = new ReminderRepository();
  });

  beforeEach(async () => {
    // Create a test user and get auth token
    const timestamp = Date.now();
    const userData = {
      username: `budgettest${timestamp}`,
      email: `budget${timestamp}@example.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    testUserId = registerResponse.body.data.user.id;
    authToken = registerResponse.body.data.token;

    // Create a test wallet
    const walletResponse = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Wallet' });

    testWalletId = walletResponse.body.data.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testReminderId) {
      try {
        await reminderRepository.delete(testReminderId);
      } catch (error) {
        // Ignore cleanup errors
      }
      testReminderId = '';
    }

    if (testBudgetId) {
      try {
        await budgetRepository.delete(testBudgetId);
      } catch (error) {
        // Ignore cleanup errors
      }
      testBudgetId = '';
    }

    if (testWalletId) {
      try {
        await walletRepository.delete(testWalletId);
      } catch (error) {
        // Ignore cleanup errors
      }
      testWalletId = '';
    }

    if (testUserId) {
      try {
        await userRepository.delete(testUserId);
      } catch (error) {
        // Ignore cleanup errors
      }
      testUserId = '';
    }
  });

  describe('Budget Management', () => {
    describe('POST /api/budgets', () => {
      it('should create a new budget successfully', async () => {
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        const budgetData = {
          wallet_id: testWalletId,
          month: currentMonth,
          limit: 1000.00
        };

        const response = await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(budgetData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.wallet_id).toBe(testWalletId);
        expect(response.body.data.month).toBe(currentMonth);
        expect(parseFloat(response.body.data.limit)).toBe(budgetData.limit);

        testBudgetId = response.body.data.id;
      });

      it('should reject budget creation with invalid data', async () => {
        const budgetData = {
          wallet_id: testWalletId,
          month: 'invalid-month',
          limit: -100
        };

        const response = await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(budgetData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_FAILED');
      });
    });

    describe('GET /api/budgets', () => {
      beforeEach(async () => {
        // Create a test budget
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        const budgetResponse = await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            wallet_id: testWalletId,
            month: currentMonth,
            limit: 500.00
          });

        testBudgetId = budgetResponse.body.data.id;
      });

      it('should get user budgets successfully', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('wallet_id');
        expect(response.body.data[0]).toHaveProperty('month');
        expect(response.body.data[0]).toHaveProperty('limit');
      });
    });

    describe('GET /api/budgets/:id/status', () => {
      beforeEach(async () => {
        // Create a test budget
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        const budgetResponse = await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            wallet_id: testWalletId,
            month: currentMonth,
            limit: 1000.00
          });

        testBudgetId = budgetResponse.body.data.id;
      });

      it('should get budget status with calculations', async () => {
        const response = await request(app)
          .get(`/api/budgets/${testBudgetId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('budget');
        expect(response.body.data).toHaveProperty('spent');
        expect(response.body.data).toHaveProperty('remaining');
        expect(response.body.data).toHaveProperty('percentage');
        expect(response.body.data).toHaveProperty('status');
      });
    });
  });

  describe('Reminder Management', () => {
    describe('POST /api/reminders', () => {
      it('should create a new reminder successfully', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        
        const reminderData = {
          title: 'Test Payment Reminder',
          amount: 250.00,
          type: 'Payment',
          due_date: futureDate.toISOString().split('T')[0],
          wallet_id: testWalletId,
          recurrence: 'monthly'
        };

        const response = await request(app)
          .post('/api/reminders')
          .set('Authorization', `Bearer ${authToken}`)
          .send(reminderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.title).toBe(reminderData.title);
        expect(parseFloat(response.body.data.amount)).toBe(reminderData.amount);
        expect(response.body.data.type).toBe(reminderData.type);
        expect(response.body.data.recurrence).toBe(reminderData.recurrence);
        expect(response.body.data.user_id).toBe(testUserId);

        testReminderId = response.body.data.id;
      });

      it('should create a receivable reminder successfully', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 14);
        
        const reminderData = {
          title: 'Test Receivable Reminder',
          amount: 500.00,
          type: 'Receivable',
          due_date: futureDate.toISOString().split('T')[0],
          recurrence: 'once'
        };

        const response = await request(app)
          .post('/api/reminders')
          .set('Authorization', `Bearer ${authToken}`)
          .send(reminderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe('Receivable');
        expect(response.body.data.recurrence).toBe('once');

        testReminderId = response.body.data.id;
      });

      it('should reject reminder creation with invalid data', async () => {
        const reminderData = {
          title: '',
          amount: -100,
          type: 'InvalidType',
          due_date: 'invalid-date'
        };

        const response = await request(app)
          .post('/api/reminders')
          .set('Authorization', `Bearer ${authToken}`)
          .send(reminderData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_FAILED');
      });
    });

    describe('GET /api/reminders', () => {
      beforeEach(async () => {
        // Create test reminders
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        
        const reminderResponse = await request(app)
          .post('/api/reminders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Reminder',
            amount: 100.00,
            type: 'Payment',
            due_date: futureDate.toISOString().split('T')[0],
            recurrence: 'weekly'
          });

        testReminderId = reminderResponse.body.data.id;
      });

      it('should get user reminders successfully', async () => {
        const response = await request(app)
          .get('/api/reminders')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('title');
        expect(response.body.data[0]).toHaveProperty('amount');
        expect(response.body.data[0]).toHaveProperty('type');
        expect(response.body.data[0]).toHaveProperty('due_date');
      });

      it('should filter reminders by type', async () => {
        const response = await request(app)
          .get('/api/reminders?type=Payment')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        response.body.data.forEach((reminder: any) => {
          expect(reminder.type).toBe('Payment');
        });
      });
    });

    describe('GET /api/reminders/upcoming', () => {
      beforeEach(async () => {
        // Create an upcoming reminder
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        
        const reminderResponse = await request(app)
          .post('/api/reminders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Upcoming Reminder',
            amount: 75.00,
            type: 'Payment',
            due_date: futureDate.toISOString().split('T')[0],
            recurrence: 'once'
          });

        testReminderId = reminderResponse.body.data.id;
      });

      it('should get upcoming reminders successfully', async () => {
        const response = await request(app)
          .get('/api/reminders/upcoming?days=7')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        // Should include the reminder created 3 days in the future
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('PUT /api/reminders/:id/deactivate', () => {
      beforeEach(async () => {
        // Create a reminder to deactivate
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        
        const reminderResponse = await request(app)
          .post('/api/reminders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Reminder to Deactivate',
            amount: 200.00,
            type: 'Payment',
            due_date: futureDate.toISOString().split('T')[0],
            recurrence: 'monthly'
          });

        testReminderId = reminderResponse.body.data.id;
      });

      it('should deactivate reminder successfully', async () => {
        const response = await request(app)
          .put(`/api/reminders/${testReminderId}/deactivate`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.is_active).toBe(false);
      });
    });
  });

  describe('Integration between Budget and Reminder Systems', () => {
    it('should work together for comprehensive financial management', async () => {
      // Create a budget
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const budgetResponse = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          wallet_id: testWalletId,
          month: currentMonth,
          limit: 800.00
        });

      testBudgetId = budgetResponse.body.data.id;

      // Create a payment reminder
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      
      const reminderResponse = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Monthly Budget Review',
          amount: 0.00,
          type: 'Payment',
          due_date: futureDate.toISOString().split('T')[0],
          wallet_id: testWalletId,
          recurrence: 'monthly'
        });

      testReminderId = reminderResponse.body.data.id;

      // Verify both were created successfully
      expect(budgetResponse.body.success).toBe(true);
      expect(reminderResponse.body.success).toBe(true);

      // Get budget status
      const budgetStatusResponse = await request(app)
        .get(`/api/budgets/${testBudgetId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(budgetStatusResponse.body.success).toBe(true);

      // Get upcoming reminders
      const upcomingResponse = await request(app)
        .get('/api/reminders/upcoming?days=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(upcomingResponse.body.success).toBe(true);
      expect(upcomingResponse.body.data.length).toBeGreaterThan(0);
    });
  });
});