import { BaseRepository } from './BaseRepository';
import { Category } from '../types';

export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super('categories');
  }

  async findByUserId(userId: string): Promise<Category[]> {
    return this.db(this.tableName)
      .where({ user_id: userId })
      .orderBy('name', 'asc')
      .select('*');
  }

  async findByUserIdAndType(userId: string, type: 'Income' | 'Expense'): Promise<Category[]> {
    return this.db(this.tableName)
      .where({ user_id: userId, type })
      .orderBy('name', 'asc')
      .select('*');
  }

  async findByWalletId(walletId: string): Promise<Category[]> {
    return this.db(this.tableName)
      .where({ wallet_id: walletId })
      .orderBy('name', 'asc')
      .select('*');
  }

  async findUserCategory(categoryId: string, userId: string): Promise<Category | null> {
    const result = await this.db(this.tableName)
      .where({ id: categoryId, user_id: userId })
      .first();
    return result || null;
  }

  async findByNameAndUser(name: string, userId: string, walletId?: string | null): Promise<Category | null> {
    let query = this.db(this.tableName)
      .where({ name: name.trim(), user_id: userId });
    
    if (walletId !== undefined) {
      query = query.where({ wallet_id: walletId });
    }
    
    const result = await query.first();
    return result || null;
  }

  async countUserCategories(userId: string): Promise<number> {
    const result = await this.db(this.tableName)
      .where({ user_id: userId })
      .count('* as count')
      .first();
    return parseInt(result?.count as string) || 0;
  }

  async hasTransactions(categoryId: string): Promise<boolean> {
    const result = await this.db('transactions_2_0')
      .where({ category_id: categoryId })
      .select('id')
      .first();
    return !!result;
  }

  async countTransactions(categoryId: string): Promise<number> {
    const result = await this.db('transactions_2_0')
      .where({ category_id: categoryId })
      .count('* as count')
      .first();
    return parseInt(result?.count as string) || 0;
  }

  async markTransactionsAsUncategorized(categoryId: string): Promise<number> {
    const updatedRows = await this.db('transactions_2_0')
      .where({ category_id: categoryId })
      .update({ category_id: null, updated_at: new Date() });
    return updatedRows;
  }

  async getUncategorizedTransactions(userId: string): Promise<any[]> {
    return this.db('transactions_2_0')
      .where({ user_id: userId, category_id: null })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  async findByIds(categoryIds: string[]): Promise<Category[]> {
    if (categoryIds.length === 0) return [];
    
    return this.db(this.tableName)
      .whereIn('id', categoryIds)
      .select('*');
  }

  // Enhanced security methods for data isolation
  async findByIdWithOwnershipValidation(id: string, userId: string): Promise<Category | null> {
    const result = await this.db(this.tableName)
      .where({ id, user_id: userId })
      .first();
    return result || null;
  }

  async findByIdWithWalletAccess(id: string, userId: string, accessibleWalletIds: string[]): Promise<Category | null> {
    const result = await this.db(this.tableName)
      .where({ id })
      .where(function() {
        this.where({ user_id: userId, wallet_id: null })
          .orWhere(function() {
            if (accessibleWalletIds.length > 0) {
              this.whereIn('wallet_id', accessibleWalletIds);
            } else {
              this.where('1', '0'); // Always false condition
            }
          });
      })
      .first();
    return result || null;
  }

  async updateWithOwnershipValidation(id: string, userId: string, data: Partial<Category>): Promise<Category | null> {
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

  async findUserAccessibleCategories(userId: string, accessibleWalletIds: string[]): Promise<Category[]> {
    return this.db(this.tableName)
      .where(function() {
        this.where({ user_id: userId, wallet_id: null })
          .orWhere(function() {
            if (accessibleWalletIds.length > 0) {
              this.whereIn('wallet_id', accessibleWalletIds);
            } else {
              this.where('1', '0'); // Always false condition
            }
          });
      })
      .orderBy('name', 'asc')
      .select('*');
  }
}