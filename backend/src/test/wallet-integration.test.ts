import request from 'supertest';
import app from '../index';
import { UserRepository } from '../repositories/UserRepository';
import { WalletRepository } from '../repositories/WalletRepository';

describe('Wallet Management Integration Tests', () => {
  let userRepository: UserRepository;
  let walletRepository: WalletRepository;
  let testUserId: string;
  let authToken: string;
  let testWalletId: string;

  beforeAll(() => {
    userRepository = new UserRepository();
    walletRepository = new WalletRepository();
  });

  beforeEach(async () => {
    // Create a test user and get auth token
    const timestamp = Date.now();
    const userData = {
      username: `wallettest${timestamp}`,
      email: `wallet${timestamp}@example.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    testUserId = registerResponse.body.data.user.id;
    authToken = registerResponse.body.data.token;
  });

  afterEach(async () => {
    // Clean up test data
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

  describe('POST /api/wallets', () => {
    it('should create a new wallet successfully', async () => {
      const walletData = {
        name: 'Test Wallet'
      };

      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(walletData.name);
      expect(response.body.data.user_id).toBe(testUserId);
      expect(response.body.data.is_default).toBe(true); // First wallet should be default

      testWalletId = response.body.data.id;
    });

    it('should reject wallet creation without authentication', async () => {
      const walletData = {
        name: 'Test Wallet'
      };

      const response = await request(app)
        .post('/api/wallets')
        .send(walletData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should reject wallet creation with empty name', async () => {
      const walletData = {
        name: ''
      };

      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('GET /api/wallets', () => {
    beforeEach(async () => {
      // Create a test wallet
      const walletData = {
        name: 'Test Wallet'
      };

      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);

      testWalletId = response.body.data.id;
    });

    it('should get user wallets successfully', async () => {
      const response = await request(app)
        .get('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0].user_id).toBe(testUserId);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/wallets')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });
  });

  describe('GET /api/wallets/default', () => {
    beforeEach(async () => {
      // Create a test wallet (will be default)
      const walletData = {
        name: 'Default Wallet'
      };

      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);

      testWalletId = response.body.data.id;
    });

    it('should get default wallet successfully', async () => {
      const response = await request(app)
        .get('/api/wallets/default')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.is_default).toBe(true);
      expect(response.body.data.user_id).toBe(testUserId);
    });
  });

  describe('PUT /api/wallets/:id', () => {
    beforeEach(async () => {
      // Create a test wallet
      const walletData = {
        name: 'Original Wallet'
      };

      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData);

      testWalletId = response.body.data.id;
    });

    it('should update wallet successfully', async () => {
      const updateData = {
        name: 'Updated Wallet'
      };

      const response = await request(app)
        .put(`/api/wallets/${testWalletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.id).toBe(testWalletId);
    });

    it('should reject update with empty name', async () => {
      const updateData = {
        name: ''
      };

      const response = await request(app)
        .put(`/api/wallets/${testWalletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('PUT /api/wallets/:id/set-default', () => {
    let secondWalletId: string;

    beforeEach(async () => {
      // Create first wallet (will be default)
      const firstWalletResponse = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'First Wallet' });

      testWalletId = firstWalletResponse.body.data.id;

      // Create second wallet
      const secondWalletResponse = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Second Wallet' });

      secondWalletId = secondWalletResponse.body.data.id;
    });

    afterEach(async () => {
      if (secondWalletId) {
        try {
          await walletRepository.delete(secondWalletId);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should set wallet as default successfully', async () => {
      const response = await request(app)
        .put(`/api/wallets/${secondWalletId}/set-default`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_default).toBe(true);
      expect(response.body.data.id).toBe(secondWalletId);

      // Verify the previous default is no longer default
      const walletsResponse = await request(app)
        .get('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`);

      const wallets = walletsResponse.body.data;
      const defaultWallets = wallets.filter((w: any) => w.is_default);
      expect(defaultWallets.length).toBe(1);
      expect(defaultWallets[0].id).toBe(secondWalletId);
    });
  });

  describe('DELETE /api/wallets/:id', () => {
    let secondWalletId: string;

    beforeEach(async () => {
      // Create first wallet
      const firstWalletResponse = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'First Wallet' });

      testWalletId = firstWalletResponse.body.data.id;

      // Create second wallet
      const secondWalletResponse = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Second Wallet' });

      secondWalletId = secondWalletResponse.body.data.id;
    });

    afterEach(async () => {
      if (secondWalletId) {
        try {
          await walletRepository.delete(secondWalletId);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should delete wallet successfully', async () => {
      const response = await request(app)
        .delete(`/api/wallets/${secondWalletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify wallet is deleted
      const walletsResponse = await request(app)
        .get('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`);

      const wallets = walletsResponse.body.data;
      const deletedWallet = wallets.find((w: any) => w.id === secondWalletId);
      expect(deletedWallet).toBeUndefined();

      // Clear secondWalletId since it's deleted
      secondWalletId = '';
    });

    it('should reject deletion of non-existent wallet', async () => {
      const fakeWalletId = 'fake-wallet-id';

      const response = await request(app)
        .delete(`/api/wallets/${fakeWalletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('Wallet Limit Enforcement', () => {
    it('should enforce wallet creation limit', async () => {
      // Create first wallet (should succeed)
      const firstWalletResponse = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'First Wallet' });

      expect(firstWalletResponse.status).toBe(201);
      testWalletId = firstWalletResponse.body.data.id;

      // Try to create second wallet (should fail due to limit of 1)
      const secondWalletResponse = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Second Wallet' });

      expect(secondWalletResponse.status).toBe(422);
      expect(secondWalletResponse.body.success).toBe(false);
      expect(secondWalletResponse.body.error.code).toBe('WALLET_LIMIT_EXCEEDED');
    });
  });
});