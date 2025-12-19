import { BaseRepository } from './BaseRepository';
import { MigrationStatus, MigrationTransaction, LegacyTransaction } from '../types';
import { Knex } from 'knex';

export class MigrationRepository extends BaseRepository<MigrationStatus> {
  constructor() {
    super('migration_status');
  }

  async createMigrationStatus(data: Omit<MigrationStatus, 'id' | 'created_at' | 'updated_at'>): Promise<MigrationStatus> {
    return this.create(data);
  }

  async updateMigrationStatus(
    id: string, 
    data: Partial<Omit<MigrationStatus, 'id' | 'created_at'>>
  ): Promise<MigrationStatus | null> {
    return this.update(id, data);
  }

  async getMigrationStatusById(id: string): Promise<MigrationStatus | null> {
    return this.findById(id);
  }

  async getAllMigrationStatuses(): Promise<MigrationStatus[]> {
    return this.db(this.tableName)
      .select('*')
      .orderBy('started_at', 'desc');
  }

  async getMigrationStatusesByUser(userId: string): Promise<MigrationStatus[]> {
    return this.db(this.tableName)
      .where({ created_by: userId })
      .orderBy('started_at', 'desc');
  }

  // Transaction migration methods
  async insertMigratedTransaction(transaction: Omit<MigrationTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<MigrationTransaction> {
    const [result] = await this.db('transactions_2_0')
      .insert(transaction)
      .returning('*');
    return result;
  }

  async insertMigratedTransactionsBatch(transactions: Array<Omit<MigrationTransaction, 'id' | 'created_at' | 'updated_at'>>): Promise<MigrationTransaction[]> {
    const results = await this.db('transactions_2_0')
      .insert(transactions)
      .returning('*');
    return results;
  }

  async getMigratedTransactions(filters?: {
    user_id?: string;
    wallet_id?: string;
    is_migrated?: boolean;
    legacy_id?: string;
  }): Promise<MigrationTransaction[]> {
    let query = this.db('transactions_2_0').select('*');
    
    if (filters) {
      if (filters.user_id) {
        query = query.where('user_id', filters.user_id);
      }
      if (filters.wallet_id) {
        query = query.where('wallet_id', filters.wallet_id);
      }
      if (filters.is_migrated !== undefined) {
        query = query.where('is_migrated', filters.is_migrated);
      }
      if (filters.legacy_id) {
        query = query.where('legacy_id', filters.legacy_id);
      }
    }
    
    return query.orderBy('created_at', 'desc');
  }

  async updateTransactionAssociation(
    transactionId: string,
    updates: {
      user_id?: string;
      wallet_id?: string;
      category_id?: string | null;
    }
  ): Promise<MigrationTransaction | null> {
    const [result] = await this.db('transactions_2_0')
      .where({ id: transactionId })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    return result || null;
  }

  async getTransactionById(id: string): Promise<MigrationTransaction | null> {
    const result = await this.db('transactions_2_0')
      .where({ id })
      .first();
    return result || null;
  }

  // Utility methods for migration validation
  async checkLegacyIdExists(legacyId: string): Promise<boolean> {
    const result = await this.db('transactions_2_0')
      .where({ legacy_id: legacyId })
      .select('id')
      .first();
    return !!result;
  }

  async getUserDefaultWallet(userId: string): Promise<string | null> {
    const result = await this.db('wallets')
      .where({ user_id: userId, is_default: true })
      .select('id')
      .first();
    return result?.id || null;
  }

  async getUserFirstWallet(userId: string): Promise<string | null> {
    const result = await this.db('wallets')
      .where({ user_id: userId })
      .orderBy('created_at', 'asc')
      .select('id')
      .first();
    return result?.id || null;
  }

  async validateUserExists(userId: string): Promise<boolean> {
    const result = await this.db('users')
      .where({ id: userId })
      .select('id')
      .first();
    return !!result;
  }

  async validateWalletExists(walletId: string): Promise<boolean> {
    const result = await this.db('wallets')
      .where({ id: walletId })
      .select('id')
      .first();
    return !!result;
  }

  async validateCategoryExists(categoryId: string): Promise<boolean> {
    const result = await this.db('categories')
      .where({ id: categoryId })
      .select('id')
      .first();
    return !!result;
  }

  async validateWalletOwnership(walletId: string, userId: string): Promise<boolean> {
    const result = await this.db('wallets')
      .where({ id: walletId, user_id: userId })
      .select('id')
      .first();
    return !!result;
  }

  // Direct database migration methods
  async countOldTransactions(): Promise<number> {
    try {
      const result = await this.db('transactions')
        .count('* as count')
        .first();
      return parseInt(result?.count as string) || 0;
    } catch (error) {
      // If old transactions table doesn't exist, return 0
      return 0;
    }
  }

  async migrateOldTransactions(
    placeholderUserId: string,
    placeholderWalletId: string,
    adminUserId: string
  ): Promise<{ migrated_count: number }> {
    // Migrate all transactions from old table to new table
    const result = await this.db.raw(`
      INSERT INTO transactions_2_0 (
        user_id, 
        wallet_id, 
        category_id,
        type, 
        title, 
        amount, 
        created_at,
        created_by,
        is_migrated,
        legacy_id
      )
      SELECT
        ?::uuid AS user_id,
        ?::uuid AS wallet_id,
        NULL AS category_id,
        CASE 
          WHEN amount >= 0 THEN 'Expense'
          ELSE 'Income'
        END AS type,
        COALESCE(title, 'Migrated Transaction') AS title,
        ABS(amount) AS amount,
        created_at,
        ?::uuid AS created_by,
        true AS is_migrated,
        COALESCE(id::text, user_id::text || '_' || created_at::text) AS legacy_id
      FROM transactions
      WHERE id NOT IN (
        SELECT legacy_id::uuid 
        FROM transactions_2_0 
        WHERE legacy_id IS NOT NULL 
        AND legacy_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      )
    `, [placeholderUserId, placeholderWalletId, adminUserId]);

    return { migrated_count: result.rowCount || 0 };
  }

  async createPlaceholderUser(userId: string): Promise<void> {
    await this.db('users').insert({
      id: userId,
      username: 'placeholder_user',
      email: 'placeholder@migration.local',
      password_hash: '$2b$10$placeholder.hash.for.migration.user.only',
      role: 'user',
      wallet_limit: 999
    }).onConflict('id').ignore();
  }

  async createPlaceholderWallet(walletId: string, userId: string): Promise<void> {
    await this.db('wallets').insert({
      id: walletId,
      user_id: userId,
      name: 'Migrated Transactions Wallet',
      is_default: true,
      is_family: false
    }).onConflict('id').ignore();
  }
}