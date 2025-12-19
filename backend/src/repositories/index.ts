export { BaseRepository } from './BaseRepository';
export { UserRepository } from './UserRepository';
export { WalletRepository } from './WalletRepository';
export { CategoryRepository } from './CategoryRepository';
export { TransactionRepository } from './TransactionRepository';
export { BudgetRepository } from './BudgetRepository';
export { ReminderRepository } from './ReminderRepository';
export { FamilyWalletMemberRepository } from './FamilyWalletMemberRepository';
export { InvitationRepository } from './InvitationRepository';

// Import classes for instances
import { UserRepository } from './UserRepository';
import { WalletRepository } from './WalletRepository';
import { CategoryRepository } from './CategoryRepository';
import { TransactionRepository } from './TransactionRepository';
import { BudgetRepository } from './BudgetRepository';
import { ReminderRepository } from './ReminderRepository';
import { FamilyWalletMemberRepository } from './FamilyWalletMemberRepository';
import { InvitationRepository } from './InvitationRepository';

// Repository instances for easy import
export const userRepository = new UserRepository();
export const walletRepository = new WalletRepository();
export const categoryRepository = new CategoryRepository();
export const transactionRepository = new TransactionRepository();
export const budgetRepository = new BudgetRepository();
export const reminderRepository = new ReminderRepository();
export const familyWalletMemberRepository = new FamilyWalletMemberRepository();
export const invitationRepository = new InvitationRepository();