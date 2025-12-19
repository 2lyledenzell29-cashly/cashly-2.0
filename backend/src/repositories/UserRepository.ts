import { BaseRepository } from './BaseRepository';
import { User } from '../types';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db(this.tableName).where({ email }).first();
    return result || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.db(this.tableName).where({ username }).first();
    return result || null;
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const result = await this.db(this.tableName)
      .where({ email: emailOrUsername })
      .orWhere({ username: emailOrUsername })
      .first();
    return result || null;
  }

  async updateWalletLimit(userId: string, walletLimit: number): Promise<User | null> {
    return this.update(userId, { wallet_limit: walletLimit });
  }

  async findAdmins(): Promise<User[]> {
    return this.db(this.tableName).where({ role: 'admin' }).select('*');
  }
}