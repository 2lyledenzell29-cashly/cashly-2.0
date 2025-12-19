import request from 'supertest';
import app from '../index';
import { UserRepository } from '../repositories/UserRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';

describe('Transaction Management Integration Tests', () => {
  let userRepository: UserRepository;
  let walletRepository: WalletRepository;
  let categoryRepository: CategoryRepository;
  let transactionRepository: TransactionRepository;
  let testUserId: string;
  let authToken: string;
  let testWalletId: string;
  let testCategoryId: string;
  let testTransactionId: string;

  beforeAll(() => {
    userRepository = new UserRepository();
    walletRepository = new WalletRepository();
    categoryRepository = new CategoryRepository();
    transactionRepository = new TransactionRepository();
  });

  beforeEach(async () => {
    // Create a test user and get auth token
    const timestamp = Date.now();
    const userData = {
      username: `transactiontest${timestamp}`,
      email: `transaction${timestamp}@example.com`,
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

    // Create a test category
    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Category', type: 'Expense' });

    testCategoryId = categoryResponse.body.data.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testTransactionId) {
      try {
        await transactionRepository.delete(testTransactionId);
      } catch (error) {
        // Ignore cleanup errors
      }
      testTransactionId = '';
    }

    if (testCategoryId) {
      try {
        await categoryRepository.delete(testCategoryId);
      } catch (error) {
        // Ignore cleanup errors
      }
      testCategoryId = '';
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

  describe('POST /api/transactions', () => {
    it('should create a new transaction successfully', async () => {
      const transactionData = {
        title: 'Test Transaction',
        amount: 100.50,
        type: 'Expense',
        category_id: testCategoryId,
        wallet_id: testWalletId
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(transactionData.title);
      expect(response.body.data.amount).toBe(transactionData.amount);
      expect(response.body.data.type).toBe(transactionData.type);
      expect(response.body.data.category_id).toBe(testCategoryId);
      expect(response.body.data.wallet_id).toBe(testWalletId);
      expect(response.body.data.user_id).toBe(testUserId);

      testTransactionId = response.body.data.id;
    });

    it('should create transaction without category (uncategorized)', async () => {
      const transactionData = {
        title: 'Uncategorized Transaction',
        amount: 50.00,
        type: 'Income',
        wallet_id: testWalletId
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(transactionData.title);
      expect(response.body.data.category_id).toBeNull();

      testTransactionId = response.body.data.id;
    });

    it('should create transaction without wallet (use default)', async () => {
      const transactionData = {
        title: 'Default Wallet Transaction',
        amount: 75.25,
        type: 'Expense',
        category_id: testCategoryId
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(transactionData.title);
      expect(response.body.data.wallet_id).toBe(testWalletId); // Should use default wallet

      testTransactionId = response.body.data.id;
    });

    it('should reject transaction creation without authentication', async () => {
      const transactionData = {
        title: 'Test Transaction',
        amount: 100.00,
        type: 'Expense'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should reject transaction with invalid data', async () => {
      const transactionData = {
        title: '',
        amount: -100,
        type: 'InvalidType'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      // Create test transactions
      const transactions = [
        {
          title: 'Income Transaction',
          amount: 1000.00,
          type: 'Income',
          wallet_id: testWalletId
        },
        {
          title: 'Expense Transaction',
          amount: 200.00,
          type: 'Expense',
          category_id: testCategoryId,
          wallet_id: testWalletId
        }
      ];

      for (const transaction of transactions) {
        const response = await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(transaction);

        if (!testTransactionId) {
          testTransactionId = response.body.data.id;
        }
      }
    });

    it('should get user transactions successfully', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('should filter transactions by type', async () => {
      const response = await request(app)
        .get('/api/transactions?type=Income')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
      response.body.data.transactions.forEach((transaction: any) => {
        expect(transaction.type).toBe('Income');
      });
    });

    it('should filter transactions by wallet', async () => {
      const response = await request(app)
        .get(`/api/transactions?wallet_id=${testWalletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.transactions.forEach((transaction: any) => {
        expect(transaction.wallet_id).toBe(testWalletId);
      });
    });

    it('should paginate transactions', async () => {
      const response = await request(app)
        .get('/api/transactions?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions.length).toBeLessThanOrEqual(1);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(1);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    beforeEach(async () => {
      // Create a test transaction
      const transactionData = {
        title: 'Original Transaction',
        amount: 100.00,
        type: 'Expense',
        category_id: testCategoryId,
        wallet_id: testWalletId
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      testTransactionId = response.body.data.id;
    });

    it('should update transaction successfully', async () => {
      const updateData = {
        title: 'Updated Transaction',
        amount: 150.00,
        type: 'Income',
        wallet_id: testWalletId
      };

      const response = await request(app)
        .put(`/api/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.amount).toBe(updateData.amount);
      expect(response.body.data.type).toBe(updateData.type);
    });

    it('should reject update with invalid data', async () => {
      const updateData = {
        title: '',
        amount: -50
      };

      const response = await request(app)
        .put(`/api/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    beforeEach(async () => {
      // Create a test transaction
      const transactionData = {
        title: 'Transaction to Delete',
        amount: 100.00,
        type: 'Expense',
        wallet_id: testWalletId
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      testTransactionId = response.body.data.id;
    });

    it('should delete transaction successfully', async () => {
      const response = await request(app)
        .delete(`/api/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify transaction is deleted
      const getResponse = await request(app)
        .get(`/api/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);

      // Clear testTransactionId since it's deleted
      testTransactionId = '';
    });
  });

  describe('GET /api/transactions/summary', () => {
    beforeEach(async () => {
      // Create test transactions for summary
      const transactions = [
        {
          title: 'Income 1',
          amount: 1000.00,
          type: 'Income',
          wallet_id: testWalletId
        },
        {
          title: 'Income 2',
          amount: 500.00,
          type: 'Income',
          wallet_id: testWalletId
        },
        {
          title: 'Expense 1',
          amount: 200.00,
          type: 'Expense',
          wallet_id: testWalletId
        },
        {
          title: 'Expense 2',
          amount: 300.00,
          type: 'Expense',
          wallet_id: testWalletId
        }
      ];

      for (const transaction of transactions) {
        const response = await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(transaction);

        if (!testTransactionId) {
          testTransactionId = response.body.data.id;
        }
      }
    });

    it('should get transaction summary successfully', async () => {
      const response = await request(app)
        .get('/api/transactions/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalIncome');
      expect(response.body.data).toHaveProperty('totalExpense');
      expect(response.body.data).toHaveProperty('balance');
      expect(response.body.data).toHaveProperty('transactionCount');
      
      expect(response.body.data.totalIncome).toBe(1500.00);
      expect(response.body.data.totalExpense).toBe(500.00);
      expect(response.body.data.balance).toBe(1000.00);
      expect(response.body.data.transactionCount).toBe(4);
    });
  });
});