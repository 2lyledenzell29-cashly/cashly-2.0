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
}