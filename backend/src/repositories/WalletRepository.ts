import { BaseRepository } from './BaseRepository';
import { Wallet } from '../types';

export class WalletRepository extends BaseRepository<Wallet> {
  constructor() {
    super('wallets');
  }

  async findByUserId(userId: string): Promise<Wallet[]> {
    return this.db(this.tableName).where({ user_id: userId }).select('*');
  }

  async findDefaultWallet(userId: string): Promise<Wallet | null> {
    const result = await this.db(this.tableName)
      .where({ user_id: userId, is_default: true })
      .first();
    return result || null;
  }

  async setDefaultWallet(userId: string, walletId: string): Promise<void> {
    // Start a transaction to ensure atomicity
    await this.db.transaction(async (trx) => {
      // First, unset all default wallets for the user
      await trx(this.tableName)
        .where({ user_id: userId })
        .update({ is_default: false });

      // Then set the specified wallet as default
      await trx(this.tableName)
        .where({ id: walletId, user_id: userId })
        .update({ is_default: true });
    });
  }

  async countUserWallets(userId: string): Promise<number> {
    const result = await this.db(this.tableName)
      .where({ user_id: userId })
      .count('* as count')
      .first();
    return parseInt(result?.count as string) || 0;
  }

  async findFamilyWallets(userId: string): Promise<Wallet[]> {
    return this.db(this.tableName)
      .where({ user_id: userId, is_family: true })
      .select('*');
  }

  async findPersonalWallets(userId: string): Promise<Wallet[]> {
    return this.db(this.tableName)
      .where({ user_id: userId, is_family: false })
      .select('*');
  }

  // Enhanced security methods for data isolation
  async findByIdWithOwnershipValidation(id: string, userId: string): Promise<Wallet | null> {
    const result = await this.db(this.tableName)
      .where({ id, user_id: userId })
      .first();
    return result || null;
  }

  async findByIdWithAccess(id: string, userId: string, familyWalletIds: string[]): Promise<Wallet | null> {
    const result = await this.db(this.tableName)
      .where({ id })
      .where(function() {
        this.where({ user_id: userId })
          .orWhere(function() {
            if (familyWalletIds.length > 0) {
              this.where({ is_family: true }).whereIn('id', familyWalletIds);
            } else {
              this.where('1', '0'); // Always false condition
            }
          });
      })
      .first();
    return result || null;
  }

  async updateWithOwnershipValidation(id: string, userId: string, data: Partial<Wallet>): Promise<Wallet | null> {
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

  async findUserAccessibleWallets(userId: string, familyWalletIds: string[]): Promise<Wallet[]> {
    return this.db(this.tableName)
      .where(function() {
        this.where({ user_id: userId })
          .orWhere(function() {
            if (familyWalletIds.length > 0) {
              this.where({ is_family: true }).whereIn('id', familyWalletIds);
            } else {
              this.where('1', '0'); // Always false condition
            }
          });
      })
      .select('*');
  }
}