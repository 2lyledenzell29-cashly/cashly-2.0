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
}