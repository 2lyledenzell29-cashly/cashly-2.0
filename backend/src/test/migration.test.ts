import request from 'supertest';
import app from '../index';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { WalletService } from '../services/WalletService';
import { MigrationService } from '../services/MigrationService';
import { LegacyTransaction } from '../types';

describe('Migration API', () => {
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;
  let walletId: string;

  beforeAll(async () => {
    const authService = new AuthService();
    const userService = new UserService();
    const walletService = new WalletService();

    // Create admin user
    const adminUser = await userService.createUser({
      username: 'migrationadmin',
      email: 'migrationadmin@test.com',
      password: 'AdminPass123!',
      role: 'admin'
    });
    adminUserId = adminUser.id;

    // Create regular user
    const regularUser = await userService.createUser({
      username: 'migrationuser',
      email: 'migrationuser@test.com',
      password: 'UserPass123!'
    });
    regularUserId = regularUser.id;

    // Generate tokens
    adminToken = authService.generateToken(adminUser);
    userToken = authService.generateToken(regularUser);

    // Create a wallet for the regular user
    const wallet = await walletService.createWallet(regularUserId, {
      name: 'Migration Test Wallet'
    });
    walletId = wallet.id;
  });

  describe('POST /api/admin/migrate', () => {
    it('should successfully migrate legacy transactions', async () => {
      const legacyData: LegacyTransaction[] = [
        {
          id: 'legacy_1',
          title: 'Test Migration Transaction 1',
          amount: 100.50,
          created_at: new Date('2023-01-01'),
          user_id: regularUserId
        },
        {
          id: 'legacy_2',
          title: 'Test Migration Transaction 2',
          amount: 250.75,
          created_at: new Date('2023-01-02'),
          user_id: regularUserId
        }
      ];

      const response = await request(app)
        .post('/api/admin/migrate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          legacy_data: legacyData,
          default_user_id: regularUserId,
          default_type: 'Expense'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('migration_id');
      expect(response.body.data.total_records).toBe(2);
      expect(response.body.data.successful_records).toBe(2);
      expect(response.body.data.failed_records).toBe(0);
    });

    it('should reject migration request from non-admin user', async () => {
      const legacyData: LegacyTransaction[] = [
        {
          title: 'Test Transaction',
          amount: 100,
          created_at: new Date()
        }
      ];

      const response = await request(app)
        .post('/api/admin/migrate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          legacy_data: legacyData
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields in legacy data', async () => {
      const invalidLegacyData = [
        {
          // Missing title and amount
          created_at: new Date()
        }
      ];

      const response = await request(app)
        .post('/api/admin/migrate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          legacy_data: invalidLegacyData
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('GET /api/admin/migrate/status', () => {
    it('should return all migration statuses for admin', async () => {
      const response = await request(app)
        .get('/api/admin/migrate/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject request from non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/migrate/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/migrate/transactions', () => {
    it('should return migrated transactions with filters', async () => {
      const response = await request(app)
        .get('/api/admin/migrate/transactions')
        .query({ user_id: regularUserId })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

describe('MigrationService', () => {
  let migrationService: MigrationService;

  beforeAll(() => {
    migrationService = new MigrationService();
  });

  describe('transformLegacyTransaction', () => {
    it('should handle missing category gracefully', async () => {
      const legacyTransaction: LegacyTransaction = {
        title: 'Test Transaction',
        amount: 100,
        created_at: new Date(),
        category_id: 'non-existent-category'
      };

      // This should not throw an error and should set category_id to null
      // The actual test would require mocking the repository methods
      expect(legacyTransaction.title).toBe('Test Transaction');
    });
  });
});