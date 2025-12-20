import { BaseRepository } from './BaseRepository';
import { Invitation } from '../types';

export class InvitationRepository extends BaseRepository<Invitation> {
  constructor() {
    super('invitations');
  }

  async findByWalletId(walletId: string): Promise<Invitation[]> {
    return this.db(this.tableName)
      .where({ wallet_id: walletId })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  async findByInviterId(inviterId: string): Promise<Invitation[]> {
    return this.db(this.tableName)
      .where({ inviter_id: inviterId })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  async findByInviteeEmail(inviteeEmail: string): Promise<Invitation[]> {
    return this.db(this.tableName)
      .where({ invitee_email: inviteeEmail })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  async findPendingInvitations(inviteeEmail: string): Promise<Invitation[]> {
    return this.db(this.tableName)
      .where({ invitee_email: inviteeEmail, status: 'pending' })
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc')
      .select('*');
  }

  async findByStatus(status: 'pending' | 'accepted' | 'declined'): Promise<Invitation[]> {
    return this.db(this.tableName)
      .where({ status })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  async acceptInvitation(id: string): Promise<Invitation | null> {
    const [result] = await this.db(this.tableName)
      .where({ id })
      .update({ status: 'accepted' })
      .returning('*');
    return result || null;
  }

  async declineInvitation(id: string): Promise<Invitation | null> {
    const [result] = await this.db(this.tableName)
      .where({ id })
      .update({ status: 'declined' })
      .returning('*');
    return result || null;
  }

  async createInvitation(
    walletId: string,
    inviterId: string,
    inviteeEmail: string,
    expirationHours: number = 168 // 7 days default
  ): Promise<Invitation> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const [result] = await this.db(this.tableName)
      .insert({
        wallet_id: walletId,
        inviter_id: inviterId,
        invitee_email: inviteeEmail,
        status: 'pending',
        created_at: new Date(),
        expires_at: expiresAt
      })
      .returning('*');
    return result;
  }

  async findExistingInvitation(
    walletId: string,
    inviteeEmail: string
  ): Promise<Invitation | null> {
    const result = await this.db(this.tableName)
      .where({
        wallet_id: walletId,
        invitee_email: inviteeEmail,
        status: 'pending'
      })
      .where('expires_at', '>', new Date())
      .first();
    return result || null;
  }

  async cleanupExpiredInvitations(): Promise<number> {
    return this.db(this.tableName)
      .where('expires_at', '<', new Date())
      .where({ status: 'pending' })
      .update({ status: 'declined' });
  }
}