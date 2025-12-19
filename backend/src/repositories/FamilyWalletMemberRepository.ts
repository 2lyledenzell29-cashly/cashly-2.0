import { BaseRepository } from './BaseRepository';
import { FamilyWalletMember } from '../types';

export class FamilyWalletMemberRepository extends BaseRepository<FamilyWalletMember> {
  constructor() {
    super('family_wallet_members');
  }

  async findByWalletId(walletId: string): Promise<FamilyWalletMember[]> {
    return this.db(this.tableName).where({ wallet_id: walletId }).select('*');
  }

  async findByUserId(userId: string): Promise<FamilyWalletMember[]> {
    return this.db(this.tableName).where({ user_id: userId }).select('*');
  }

  async findMembership(walletId: string, userId: string): Promise<FamilyWalletMember | null> {
    const result = await this.db(this.tableName)
      .where({ wallet_id: walletId, user_id: userId })
      .first();
    return result || null;
  }

  async isWalletMember(walletId: string, userId: string): Promise<boolean> {
    const membership = await this.findMembership(walletId, userId);
    return !!membership;
  }

  async isWalletOwner(walletId: string, userId: string): Promise<boolean> {
    const membership = await this.findMembership(walletId, userId);
    return membership?.role === 'owner';
  }

  async addMember(walletId: string, userId: string, role: 'owner' | 'member' = 'member'): Promise<FamilyWalletMember> {
    const [result] = await this.db(this.tableName)
      .insert({
        wallet_id: walletId,
        user_id: userId,
        role,
        joined_at: new Date()
      })
      .returning('*');
    return result;
  }

  async removeMember(walletId: string, userId: string): Promise<boolean> {
    const deletedRows = await this.db(this.tableName)
      .where({ wallet_id: walletId, user_id: userId })
      .del();
    return deletedRows > 0;
  }

  async getUserFamilyWalletIds(userId: string): Promise<string[]> {
    const memberships = await this.db(this.tableName)
      .where({ user_id: userId })
      .select('wallet_id');
    
    return memberships.map(m => m.wallet_id);
  }

  async getWalletMembers(walletId: string): Promise<FamilyWalletMember[]> {
    return this.db(this.tableName)
      .where({ wallet_id: walletId })
      .orderBy('joined_at', 'asc')
      .select('*');
  }

  async updateMemberRole(walletId: string, userId: string, role: 'owner' | 'member'): Promise<FamilyWalletMember | null> {
    const [result] = await this.db(this.tableName)
      .where({ wallet_id: walletId, user_id: userId })
      .update({ role })
      .returning('*');
    return result || null;
  }
}