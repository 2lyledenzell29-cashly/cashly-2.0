import { BaseRepository } from './BaseRepository';
import { Budget } from '../types';

export class BudgetRepository extends BaseRepository<Budget> {
  constructor() {
    super('budgets');
  }

  async findByWalletId(walletId: string): Promise<Budget[]> {
    return this.db(this.tableName)
      .where({ wallet_id: walletId })
      .orderBy('month', 'desc')
      .select('*');
  }

  async findByWalletAndMonth(walletId: string, month: string): Promise<Budget | null> {
    const result = await this.db(this.tableName)
      .where({ wallet_id: walletId, month })
      .first();
    return result || null;
  }

  async findCurrentMonthBudget(walletId: string): Promise<Budget | null> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    return this.findByWalletAndMonth(walletId, currentMonth);
  }

  async findBudgetsByUserId(userId: string): Promise<Budget[]> {
    return this.db(this.tableName)
      .join('wallets', 'budgets.wallet_id', 'wallets.id')
      .where('wallets.user_id', userId)
      .select('budgets.*')
      .orderBy('budgets.month', 'desc');
  }

  async deleteBudgetsByWalletId(walletId: string): Promise<number> {
    return this.db(this.tableName)
      .where({ wallet_id: walletId })
      .del();
  }

  // Enhanced security methods for data isolation
  async findByIdWithWalletAccess(id: string, accessibleWalletIds: string[]): Promise<Budget | null> {
    if (accessibleWalletIds.length === 0) {
      return null;
    }

    const result = await this.db(this.tableName)
      .where({ id })
      .whereIn('wallet_id', accessibleWalletIds)
      .first();
    return result || null;
  }

  async updateWithWalletAccess(id: string, accessibleWalletIds: string[], data: Partial<Budget>): Promise<Budget | null> {
    if (accessibleWalletIds.length === 0) {
      return null;
    }

    const [result] = await this.db(this.tableName)
      .where({ id })
      .whereIn('wallet_id', accessibleWalletIds)
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return result || null;
  }

  async deleteWithWalletAccess(id: string, accessibleWalletIds: string[]): Promise<boolean> {
    if (accessibleWalletIds.length === 0) {
      return false;
    }

    const deletedRows = await this.db(this.tableName)
      .where({ id })
      .whereIn('wallet_id', accessibleWalletIds)
      .del();
    return deletedRows > 0;
  }

  async findUserAccessibleBudgets(accessibleWalletIds: string[]): Promise<Budget[]> {
    if (accessibleWalletIds.length === 0) {
      return [];
    }

    return this.db(this.tableName)
      .whereIn('wallet_id', accessibleWalletIds)
      .orderBy('month', 'desc')
      .select('*');
  }
}