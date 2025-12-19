import { BaseRepository } from './BaseRepository';
import { Reminder } from '../types';

export class ReminderRepository extends BaseRepository<Reminder> {
  constructor() {
    super('reminders');
  }

  async findByUserId(userId: string): Promise<Reminder[]> {
    return this.db(this.tableName)
      .where({ user_id: userId })
      .orderBy('due_date', 'asc')
      .select('*');
  }

  async findByWalletId(walletId: string): Promise<Reminder[]> {
    return this.db(this.tableName)
      .where({ wallet_id: walletId })
      .orderBy('due_date', 'asc')
      .select('*');
  }

  async findActiveReminders(userId: string): Promise<Reminder[]> {
    return this.db(this.tableName)
      .where({ user_id: userId, is_active: true })
      .orderBy('due_date', 'asc')
      .select('*');
  }

  async findUpcomingReminders(userId: string, days: number = 7): Promise<Reminder[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.db(this.tableName)
      .where({ user_id: userId, is_active: true })
      .whereBetween('due_date', [today, futureDate])
      .orderBy('due_date', 'asc')
      .select('*');
  }

  async findOverdueReminders(userId: string): Promise<Reminder[]> {
    const today = new Date();
    
    return this.db(this.tableName)
      .where({ user_id: userId, is_active: true })
      .where('due_date', '<', today)
      .orderBy('due_date', 'asc')
      .select('*');
  }

  async findByType(userId: string, type: 'Payment' | 'Receivable'): Promise<Reminder[]> {
    return this.db(this.tableName)
      .where({ user_id: userId, type })
      .orderBy('due_date', 'asc')
      .select('*');
  }

  async deactivateReminder(id: string): Promise<Reminder | null> {
    return this.update(id, { is_active: false });
  }

  async activateReminder(id: string): Promise<Reminder | null> {
    return this.update(id, { is_active: true });
  }

  async findUserAccessibleReminders(userId: string, familyWalletIds: string[] = []): Promise<Reminder[]> {
    let query = this.db(this.tableName)
      .where({ user_id: userId });

    if (familyWalletIds.length > 0) {
      query = query.orWhereIn('wallet_id', familyWalletIds);
    }

    return query.orderBy('due_date', 'asc').select('*');
  }
}