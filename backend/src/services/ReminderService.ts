import { v4 as uuidv4 } from 'uuid';
import { ReminderRepository } from '../repositories/ReminderRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { FamilyWalletMemberRepository } from '../repositories/FamilyWalletMemberRepository';
import { Reminder, CreateReminderRequest, UpdateReminderRequest } from '../types';

export class ReminderService {
  private reminderRepository: ReminderRepository;
  private walletRepository: WalletRepository;
  private familyWalletMemberRepository: FamilyWalletMemberRepository;

  constructor() {
    this.reminderRepository = new ReminderRepository();
    this.walletRepository = new WalletRepository();
    this.familyWalletMemberRepository = new FamilyWalletMemberRepository();
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    // Get user's family wallet IDs for shared access
    const familyWalletIds = await this.getFamilyWalletIds(userId);
    return this.reminderRepository.findUserAccessibleReminders(userId, familyWalletIds);
  }

  async getActiveReminders(userId: string): Promise<Reminder[]> {
    return this.reminderRepository.findActiveReminders(userId);
  }

  async getUpcomingReminders(userId: string, days: number = 7): Promise<Reminder[]> {
    return this.reminderRepository.findUpcomingReminders(userId, days);
  }

  async getOverdueReminders(userId: string): Promise<Reminder[]> {
    return this.reminderRepository.findOverdueReminders(userId);
  }

  async getRemindersByType(userId: string, type: 'Payment' | 'Receivable'): Promise<Reminder[]> {
    return this.reminderRepository.findByType(userId, type);
  }

  async getReminderById(reminderId: string, userId: string): Promise<Reminder | null> {
    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      return null;
    }

    // Check if user owns the reminder or has access through family wallet
    if (reminder.user_id === userId) {
      return reminder;
    }

    // Check family wallet access if reminder is associated with a wallet
    if (reminder.wallet_id) {
      const hasAccess = await this.hasWalletAccess(userId, reminder.wallet_id);
      if (hasAccess) {
        return reminder;
      }
    }

    return null;
  }

  async createReminder(userId: string, reminderData: CreateReminderRequest): Promise<Reminder> {
    // Validate wallet access if wallet_id is provided
    if (reminderData.wallet_id) {
      const hasAccess = await this.hasWalletAccess(userId, reminderData.wallet_id);
      if (!hasAccess) {
        throw new Error('RESOURCE_NOT_FOUND');
      }
    }

    // Validate amount is positive
    if (reminderData.amount <= 0) {
      throw new Error('VALIDATION_INVALID_AMOUNT');
    }

    // Validate due date
    const dueDate = new Date(reminderData.due_date);
    if (isNaN(dueDate.getTime())) {
      throw new Error('VALIDATION_INVALID_DATE');
    }

    // Validate recurrence interval for custom recurrence
    if (reminderData.recurrence === 'custom') {
      if (!reminderData.recurrence_interval || reminderData.recurrence_interval <= 0) {
        throw new Error('VALIDATION_INVALID_RECURRENCE_INTERVAL');
      }
    }

    // Validate duration_end if provided
    let durationEnd: Date | null = null;
    if (reminderData.duration_end) {
      durationEnd = new Date(reminderData.duration_end);
      if (isNaN(durationEnd.getTime())) {
        throw new Error('VALIDATION_INVALID_DURATION_END');
      }

      // Duration end should be after due date
      if (durationEnd <= dueDate) {
        throw new Error('VALIDATION_DURATION_END_BEFORE_DUE_DATE');
      }
    }

    const newReminder: Reminder = {
      id: uuidv4(),
      user_id: userId,
      wallet_id: reminderData.wallet_id || null,
      title: reminderData.title.trim(),
      amount: reminderData.amount,
      type: reminderData.type,
      due_date: dueDate,
      recurrence: reminderData.recurrence || 'once',
      recurrence_interval: reminderData.recurrence_interval || null,
      duration_end: durationEnd,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    return this.reminderRepository.create(newReminder);
  }

  async updateReminder(reminderId: string, userId: string, reminderData: UpdateReminderRequest): Promise<Reminder | null> {
    // Check if reminder exists and user has access
    const existingReminder = await this.getReminderById(reminderId, userId);
    if (!existingReminder) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Validate wallet access if wallet_id is being changed
    if (reminderData.wallet_id !== undefined) {
      if (reminderData.wallet_id) {
        const hasAccess = await this.hasWalletAccess(userId, reminderData.wallet_id);
        if (!hasAccess) {
          throw new Error('RESOURCE_NOT_FOUND');
        }
      }
    }

    // Validate amount if provided
    if (reminderData.amount !== undefined && reminderData.amount <= 0) {
      throw new Error('VALIDATION_INVALID_AMOUNT');
    }

    // Validate due date if provided
    let dueDate: Date | undefined;
    if (reminderData.due_date) {
      dueDate = new Date(reminderData.due_date);
      if (isNaN(dueDate.getTime())) {
        throw new Error('VALIDATION_INVALID_DATE');
      }
    }

    // Validate recurrence interval for custom recurrence
    if (reminderData.recurrence === 'custom') {
      if (!reminderData.recurrence_interval || reminderData.recurrence_interval <= 0) {
        throw new Error('VALIDATION_INVALID_RECURRENCE_INTERVAL');
      }
    }

    // Validate duration_end if provided
    let durationEnd: Date | null | undefined;
    if (reminderData.duration_end !== undefined) {
      if (reminderData.duration_end) {
        durationEnd = new Date(reminderData.duration_end);
        if (isNaN(durationEnd.getTime())) {
          throw new Error('VALIDATION_INVALID_DURATION_END');
        }

        // Duration end should be after due date
        const checkDueDate = dueDate || existingReminder.due_date;
        if (durationEnd <= checkDueDate) {
          throw new Error('VALIDATION_DURATION_END_BEFORE_DUE_DATE');
        }
      } else {
        durationEnd = null;
      }
    }

    const updateData: Partial<Reminder> = {
      ...reminderData,
      due_date: dueDate,
      duration_end: durationEnd,
      updated_at: new Date()
    };

    // Clean up undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof Reminder] === undefined) {
        delete updateData[key as keyof Reminder];
      }
    });

    return this.reminderRepository.update(reminderId, updateData);
  }

  async deleteReminder(reminderId: string, userId: string): Promise<boolean> {
    // Check if reminder exists and user has access
    const existingReminder = await this.getReminderById(reminderId, userId);
    if (!existingReminder) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return this.reminderRepository.delete(reminderId);
  }

  async deactivateReminder(reminderId: string, userId: string): Promise<Reminder | null> {
    // Check if reminder exists and user has access
    const existingReminder = await this.getReminderById(reminderId, userId);
    if (!existingReminder) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return this.reminderRepository.deactivateReminder(reminderId);
  }

  async activateReminder(reminderId: string, userId: string): Promise<Reminder | null> {
    // Check if reminder exists and user has access
    const existingReminder = await this.getReminderById(reminderId, userId);
    if (!existingReminder) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return this.reminderRepository.activateReminder(reminderId);
  }

  async getNextReminderOccurrence(reminder: Reminder): Promise<Date | null> {
    if (reminder.recurrence === 'once') {
      return null;
    }

    const currentDueDate = new Date(reminder.due_date);
    let nextDate = new Date(currentDueDate);

    switch (reminder.recurrence) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        // Handle monthly recurrence with day adjustment for months with fewer days
        const originalDay = new Date(reminder.due_date).getDate(); // Always use the original due date day

        // Move to next month
        nextDate.setMonth(nextDate.getMonth() + 1);

        // Adjust the day for the target month (handles 31st -> 30th, 29th, 28th)
        const adjustedDay = this.adjustDayForMonth(originalDay, nextDate.getFullYear(), nextDate.getMonth());
        nextDate.setDate(adjustedDay);
        break;
      case 'custom':
        if (reminder.recurrence_interval) {
          nextDate.setDate(nextDate.getDate() + reminder.recurrence_interval);
        } else {
          return null;
        }
        break;
      default:
        return null;
    }

    // Check if next occurrence is within duration
    if (reminder.duration_end && nextDate > reminder.duration_end) {
      return null;
    }

    return nextDate;
  }

  async getAllUpcomingOccurrences(reminder: Reminder, maxOccurrences: number = 10): Promise<Date[]> {
    const occurrences: Date[] = [];
    const originalDueDate = new Date(reminder.due_date);

    // For one-time reminders, just return the due date if it's in the future
    if (reminder.recurrence === 'once') {
      const now = new Date();
      if (originalDueDate >= now) {
        occurrences.push(new Date(originalDueDate));
      }
      return occurrences;
    }

    // For recurring reminders, generate occurrences
    let currentDate = new Date(originalDueDate);
    const now = new Date();

    // If the original due date is in the past, find the next occurrence from now
    if (currentDate < now) {
      currentDate = await this.calculateNextDueDate(reminder) || new Date(originalDueDate);
    }

    // Add occurrences up to maxOccurrences
    for (let i = 0; i < maxOccurrences; i++) {
      if (currentDate) {
        occurrences.push(new Date(currentDate));

        // Calculate next occurrence
        const nextOccurrence = await this.getNextReminderOccurrence({
          ...reminder,
          due_date: currentDate
        });

        if (!nextOccurrence) {
          break;
        }

        currentDate = nextOccurrence;
      } else {
        break;
      }
    }

    return occurrences;
  }

  async getRemindersWithUpcomingOccurrences(userId: string, days: number = 30): Promise<Array<{ reminder: Reminder, nextOccurrences: Date[] }>> {
    const reminders = await this.getActiveReminders(userId);
    const results = [];

    for (const reminder of reminders) {
      const occurrences = await this.getAllUpcomingOccurrences(reminder, 5);
      const upcomingOccurrences = occurrences.filter(date => {
        const daysDiff = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= days;
      });

      if (upcomingOccurrences.length > 0) {
        results.push({
          reminder,
          nextOccurrences: upcomingOccurrences
        });
      }
    }

    return results;
  }

  async isReminderDue(reminder: Reminder, checkDate: Date = new Date()): Promise<boolean> {
    const dueDate = new Date(reminder.due_date);

    // For one-time reminders, check if the due date matches
    if (reminder.recurrence === 'once') {
      return this.isSameDay(dueDate, checkDate);
    }

    // For recurring reminders, we need to check if the checkDate matches any occurrence
    const originalDueDate = new Date(reminder.due_date);

    // If the check date is before the original due date, it can't be due
    if (checkDate < originalDueDate) {
      return false;
    }

    switch (reminder.recurrence) {
      case 'daily':
        // Calculate days difference
        const daysDiff = Math.floor((checkDate.getTime() - originalDueDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff % 1 === 0;

      case 'weekly':
        // Check if it's the same day of week and the right interval
        if (checkDate.getDay() !== originalDueDate.getDay()) {
          return false;
        }
        const weeksDiff = Math.floor((checkDate.getTime() - originalDueDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        return weeksDiff >= 0 && weeksDiff % 1 === 0;

      case 'monthly':
        // For monthly, check if the day matches (with adjustment for shorter months)
        const originalDay = originalDueDate.getDate();
        const checkDay = checkDate.getDate();
        const adjustedDay = this.adjustDayForMonth(originalDay, checkDate.getFullYear(), checkDate.getMonth());

        if (checkDay !== adjustedDay) {
          return false;
        }

        // Check if the month difference is correct
        const monthsDiff = (checkDate.getFullYear() - originalDueDate.getFullYear()) * 12 +
          (checkDate.getMonth() - originalDueDate.getMonth());
        return monthsDiff >= 0;

      case 'custom':
        if (!reminder.recurrence_interval) {
          return false;
        }
        const customDaysDiff = Math.floor((checkDate.getTime() - originalDueDate.getTime()) / (1000 * 60 * 60 * 24));
        return customDaysDiff >= 0 && customDaysDiff % reminder.recurrence_interval === 0;

      default:
        return false;
    }
  }

  async getDueReminders(userId: string, checkDate: Date = new Date()): Promise<Reminder[]> {
    const activeReminders = await this.getActiveReminders(userId);
    const dueReminders = [];

    for (const reminder of activeReminders) {
      const isDue = await this.isReminderDue(reminder, checkDate);
      if (isDue) {
        dueReminders.push(reminder);
      }
    }

    return dueReminders;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  private getLastDayOfMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  private adjustDayForMonth(originalDay: number, year: number, month: number): number {
    const lastDayOfMonth = this.getLastDayOfMonth(year, month);
    return Math.min(originalDay, lastDayOfMonth);
  }

  async calculateNextDueDate(reminder: Reminder): Promise<Date | null> {
    const now = new Date();
    const dueDate = new Date(reminder.due_date);

    // If it's a one-time reminder and already passed, return null
    if (reminder.recurrence === 'once') {
      return dueDate > now ? dueDate : null;
    }

    // For recurring reminders, find the next occurrence
    let nextDate = new Date(dueDate);

    // If the original due date is in the future, return it
    if (nextDate > now) {
      return nextDate;
    }

    // Calculate the next occurrence after now
    const maxIterations = 100; // Prevent infinite loops
    let iterations = 0;

    while (nextDate <= now && iterations < maxIterations) {
      iterations++;

      const nextOccurrence = await this.getNextReminderOccurrence({
        ...reminder,
        due_date: nextDate
      });

      if (!nextOccurrence) {
        return null;
      }

      nextDate = nextOccurrence;
    }

    return nextDate;
  }

  private async hasWalletAccess(userId: string, walletId: string): Promise<boolean> {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet) {
      return false;
    }

    // User owns the wallet
    if (wallet.user_id === userId) {
      return true;
    }

    // Check family wallet membership
    if (wallet.is_family) {
      const membership = await this.familyWalletMemberRepository.findMembership(walletId, userId);
      return membership !== null;
    }

    return false;
  }

  private async getFamilyWalletIds(userId: string): Promise<string[]> {
    const memberships = await this.familyWalletMemberRepository.findByUserId(userId);
    return memberships.map(membership => membership.wallet_id);
  }

  async validateReminderOwnership(reminderId: string, userId: string): Promise<boolean> {
    const reminder = await this.getReminderById(reminderId, userId);
    return reminder !== null;
  }
}