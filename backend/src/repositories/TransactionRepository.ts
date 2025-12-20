import { BaseRepository } from './BaseRepository';
import { Transaction } from '../types';

export interface TransactionFilters {
  user_id?: string;
  wallet_id?: string;
  category_id?: string;
  type?: 'Income' | 'Expense';
  start_date?: Date;
  end_date?: Date;
}

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super('transactions_2_0');
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.db(this.tableName).where({ user_id: userId }).select('*');
  }

  async findByWalletId(walletId: string): Promise<Transaction[]> {
    return this.db(this.tableName)
      .where({ wallet_id: walletId })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  async findByCategoryId(categoryId: string): Promise<Transaction[]> {
    return this.db(this.tableName).where({ category_id: categoryId }).select('*');
  }

  async findWithFilters(filters: TransactionFilters): Promise<Transaction[]> {
    let query = this.db(this.tableName);

    if (filters.user_id) {
      query = query.where({ user_id: filters.user_id });
    }

    if (filters.wallet_id) {
      query = query.where({ wallet_id: filters.wallet_id });
    }

    if (filters.category_id) {
      query = query.where({ category_id: filters.category_id });
    }

    if (filters.type) {
      query = query.where({ type: filters.type });
    }

    if (filters.start_date) {
      query = query.where('created_at', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query = query.where('created_at', '<=', filters.end_date);
    }

    return query.orderBy('created_at', 'desc').select('*');
  }

  async findWithPaginationAndFilters(
    page: number = 1,
    limit: number = 10,
    filters: TransactionFilters = {}
  ): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    
    let query = this.db(this.tableName);
    let countQuery = this.db(this.tableName);
    
    // Apply filters to both queries
    const applyFilters = (q: any) => {
      if (filters.user_id) q = q.where({ user_id: filters.user_id });
      if (filters.wallet_id) q = q.where({ wallet_id: filters.wallet_id });
      if (filters.category_id) q = q.where({ category_id: filters.category_id });
      if (filters.type) q = q.where({ type: filters.type });
      if (filters.start_date) q = q.where('created_at', '>=', filters.start_date);
      if (filters.end_date) q = q.where('created_at', '<=', filters.end_date);
      return q;
    };

    query = applyFilters(query);
    countQuery = applyFilters(countQuery);
    
    const [data, totalResult] = await Promise.all([
      query.select('*').orderBy('created_at', 'desc').limit(limit).offset(offset),
      countQuery.count('* as count').first()
    ]);
    
    const total = parseInt(totalResult?.count as string) || 0;
    
    return { data, total, page, limit };
  }

  async getMonthlySum(
    userId: string,
    walletId: string,
    month: string,
    type: 'Income' | 'Expense'
  ): Promise<number> {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const result = await this.db(this.tableName)
      .where({
        user_id: userId,
        wallet_id: walletId,
        type: type
      })
      .whereBetween('created_at', [startDate, endDate])
      .sum('amount as total')
      .first();

    return parseFloat(result?.total as string) || 0;
  }

  async findWithPaginationAndFiltersForWallets(
    page: number = 1,
    limit: number = 10,
    filters: TransactionFilters = {},
    walletIds: string[] = []
  ): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    
    let query = this.db(this.tableName);
    let countQuery = this.db(this.tableName);
    
    // Apply filters to both queries
    const applyFilters = (q: any) => {
      if (filters.user_id) q = q.where({ user_id: filters.user_id });
      if (filters.wallet_id) q = q.where({ wallet_id: filters.wallet_id });
      else if (walletIds.length > 0) q = q.whereIn('wallet_id', walletIds);
      if (filters.category_id) q = q.where({ category_id: filters.category_id });
      if (filters.type) q = q.where({ type: filters.type });
      if (filters.start_date) q = q.where('created_at', '>=', filters.start_date);
      if (filters.end_date) q = q.where('created_at', '<=', filters.end_date);
      return q;
    };

    query = applyFilters(query);
    countQuery = applyFilters(countQuery);
    
    const [data, totalResult] = await Promise.all([
      query.select('*').orderBy('created_at', 'desc').limit(limit).offset(offset),
      countQuery.count('* as count').first()
    ]);
    
    const total = parseInt(totalResult?.count as string) || 0;
    
    return { data, total, page, limit };
  }

  async findByWalletAndDateRange(
    walletId: string,
    startDate: Date,
    endDate: Date,
    additionalFilters?: Partial<TransactionFilters>
  ): Promise<Transaction[]> {
    let query = this.db(this.tableName)
      .where({ wallet_id: walletId })
      .whereBetween('created_at', [startDate, endDate]);

    if (additionalFilters?.type) {
      query = query.where({ type: additionalFilters.type });
    }

    if (additionalFilters?.category_id) {
      query = query.where({ category_id: additionalFilters.category_id });
    }

    return query.orderBy('created_at', 'desc').select('*');
  }

  async getSummaryByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    walletIds?: string[]
  ): Promise<{ income: number; expense: number }> {
    let query = this.db(this.tableName)
      .where({ user_id: userId })
      .whereBetween('created_at', [startDate, endDate]);

    if (walletIds && walletIds.length > 0) {
      query = query.whereIn('wallet_id', walletIds);
    }

    const results = await query
      .select('type')
      .sum('amount as total')
      .groupBy('type');

    const income = results.find(r => r.type === 'Income')?.total || 0;
    const expense = results.find(r => r.type === 'Expense')?.total || 0;

    return {
      income: parseFloat(income as string) || 0,
      expense: parseFloat(expense as string) || 0
    };
  }

  async getSummaryWithFilters(
    filters: TransactionFilters,
    walletIds: string[]
  ): Promise<{ income: number; expense: number }> {
    let query = this.db(this.tableName);

    if (filters.user_id) {
      query = query.where({ user_id: filters.user_id });
    }

    if (filters.wallet_id) {
      query = query.where({ wallet_id: filters.wallet_id });
    } else if (walletIds.length > 0) {
      query = query.whereIn('wallet_id', walletIds);
    }

    if (filters.category_id) {
      query = query.where({ category_id: filters.category_id });
    }

    if (filters.type) {
      query = query.where({ type: filters.type });
    }

    if (filters.start_date) {
      query = query.where('created_at', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query = query.where('created_at', '<=', filters.end_date);
    }

    const results = await query
      .select('type')
      .sum('amount as total')
      .groupBy('type');

    const income = results.find(r => r.type === 'Income')?.total || 0;
    const expense = results.find(r => r.type === 'Expense')?.total || 0;

    return {
      income: parseFloat(income as string) || 0,
      expense: parseFloat(expense as string) || 0
    };
  }

  async findWithFiltersForWallets(
    filters: TransactionFilters,
    walletIds: string[]
  ): Promise<Transaction[]> {
    let query = this.db(this.tableName);

    if (filters.user_id) {
      query = query.where({ user_id: filters.user_id });
    }

    if (filters.wallet_id) {
      query = query.where({ wallet_id: filters.wallet_id });
    } else if (walletIds.length > 0) {
      query = query.whereIn('wallet_id', walletIds);
    }

    if (filters.category_id) {
      query = query.where({ category_id: filters.category_id });
    }

    if (filters.type) {
      query = query.where({ type: filters.type });
    }

    if (filters.start_date) {
      query = query.where('created_at', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query = query.where('created_at', '<=', filters.end_date);
    }

    return query.orderBy('created_at', 'desc').select('*');
  }

  // Enhanced security methods for data isolation
  async findByIdWithOwnershipValidation(id: string, userId: string): Promise<Transaction | null> {
    const result = await this.db(this.tableName)
      .where({ id, user_id: userId })
      .first();
    return result || null;
  }

  async findByIdWithWalletAccess(id: string, accessibleWalletIds: string[]): Promise<Transaction | null> {
    if (accessibleWalletIds.length === 0) {
      return null;
    }

    const result = await this.db(this.tableName)
      .where({ id })
      .whereIn('wallet_id', accessibleWalletIds)
      .first();
    return result || null;
  }

  async updateWithOwnershipValidation(id: string, userId: string, data: Partial<Transaction>): Promise<Transaction | null> {
    const [result] = await this.db(this.tableName)
      .where({ id, user_id: userId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return result || null;
  }

  async deleteWithOwnershipValidation(id: string, userId: string): Promise<boolean> {
    const deletedRows = await this.db(this.tableName)
      .where({ id, user_id: userId })
      .del();
    return deletedRows > 0;
  }

  async countByUserAndWallets(userId: string, walletIds: string[]): Promise<number> {
    if (walletIds.length === 0) {
      return 0;
    }

    const result = await this.db(this.tableName)
      .where({ user_id: userId })
      .whereIn('wallet_id', walletIds)
      .count('* as count')
      .first();
    return parseInt(result?.count as string) || 0;
  }
}