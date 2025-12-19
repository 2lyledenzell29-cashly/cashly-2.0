import { User, Wallet, Category, Transaction, Budget, Reminder, FamilyWalletMember } from '@/types';

/**
 * Frontend Access Control Utilities
 * These utilities help enforce data isolation and access control on the frontend
 */

export class AccessControlService {
  /**
   * Check if user owns a wallet
   */
  static canAccessWallet(wallet: Wallet, user: User, familyMemberships?: FamilyWalletMember[]): boolean {
    if (!wallet || !user) return false;

    // User owns the wallet
    if (wallet.user_id === user.id) {
      return true;
    }

    // Check family wallet membership
    if (wallet.is_family && familyMemberships) {
      return familyMemberships.some(membership => 
        membership.wallet_id === wallet.id && membership.user_id === user.id
      );
    }

    return false;
  }

  /**
   * Check if user can modify a wallet (only owners can modify)
   */
  static canModifyWallet(wallet: Wallet, user: User): boolean {
    if (!wallet || !user) return false;
    return wallet.user_id === user.id;
  }

  /**
   * Check if user can access a category
   */
  static canAccessCategory(category: Category, user: User, accessibleWalletIds?: string[]): boolean {
    if (!category || !user) return false;

    // Personal category (belongs to user)
    if (category.user_id === user.id && category.wallet_id === null) {
      return true;
    }

    // Family wallet category (user has access to the wallet)
    if (category.wallet_id && accessibleWalletIds) {
      return accessibleWalletIds.includes(category.wallet_id);
    }

    return false;
  }

  /**
   * Check if user can modify a category (only owners can modify)
   */
  static canModifyCategory(category: Category, user: User): boolean {
    if (!category || !user) return false;
    return category.user_id === user.id;
  }

  /**
   * Check if user can access a transaction
   */
  static canAccessTransaction(transaction: Transaction, user: User, accessibleWalletIds?: string[]): boolean {
    if (!transaction || !user) return false;

    // User owns the transaction
    if (transaction.user_id === user.id) {
      return true;
    }

    // Check if user has access to the wallet
    if (accessibleWalletIds) {
      return accessibleWalletIds.includes(transaction.wallet_id);
    }

    return false;
  }

  /**
   * Check if user can modify a transaction
   */
  static canModifyTransaction(transaction: Transaction, user: User, accessibleWalletIds?: string[]): boolean {
    if (!transaction || !user) return false;

    // User created the transaction
    if (transaction.created_by === user.id) {
      return true;
    }

    // For family wallets, check if user has access to the wallet
    if (accessibleWalletIds && accessibleWalletIds.includes(transaction.wallet_id)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can access a budget
   */
  static canAccessBudget(budget: Budget, user: User, accessibleWalletIds?: string[]): boolean {
    if (!budget || !user || !accessibleWalletIds) return false;
    return accessibleWalletIds.includes(budget.wallet_id);
  }

  /**
   * Check if user can access a reminder
   */
  static canAccessReminder(reminder: Reminder, user: User, accessibleWalletIds?: string[]): boolean {
    if (!reminder || !user) return false;

    // User owns the reminder
    if (reminder.user_id === user.id) {
      return true;
    }

    // Check family wallet access if reminder is associated with a wallet
    if (reminder.wallet_id && accessibleWalletIds) {
      return accessibleWalletIds.includes(reminder.wallet_id);
    }

    return false;
  }

  /**
   * Check if user can modify a reminder (only owners can modify)
   */
  static canModifyReminder(reminder: Reminder, user: User): boolean {
    if (!reminder || !user) return false;
    return reminder.user_id === user.id;
  }

  /**
   * Check if user has admin privileges
   */
  static isAdmin(user: User): boolean {
    return user?.role === 'admin';
  }

  /**
   * Check if user can manage family wallet (only wallet owner)
   */
  static canManageFamilyWallet(wallet: Wallet, user: User): boolean {
    if (!wallet || !user) return false;
    return wallet.is_family && wallet.user_id === user.id;
  }

  /**
   * Filter wallets that user can access
   */
  static filterAccessibleWallets(wallets: Wallet[], user: User, familyMemberships?: FamilyWalletMember[]): Wallet[] {
    if (!wallets || !user) return [];
    
    return wallets.filter(wallet => 
      this.canAccessWallet(wallet, user, familyMemberships)
    );
  }

  /**
   * Filter categories that user can access
   */
  static filterAccessibleCategories(categories: Category[], user: User, accessibleWalletIds?: string[]): Category[] {
    if (!categories || !user) return [];
    
    return categories.filter(category => 
      this.canAccessCategory(category, user, accessibleWalletIds)
    );
  }

  /**
   * Filter transactions that user can access
   */
  static filterAccessibleTransactions(transactions: Transaction[], user: User, accessibleWalletIds?: string[]): Transaction[] {
    if (!transactions || !user) return [];
    
    return transactions.filter(transaction => 
      this.canAccessTransaction(transaction, user, accessibleWalletIds)
    );
  }

  /**
   * Filter budgets that user can access
   */
  static filterAccessibleBudgets(budgets: Budget[], user: User, accessibleWalletIds?: string[]): Budget[] {
    if (!budgets || !user) return [];
    
    return budgets.filter(budget => 
      this.canAccessBudget(budget, user, accessibleWalletIds)
    );
  }

  /**
   * Filter reminders that user can access
   */
  static filterAccessibleReminders(reminders: Reminder[], user: User, accessibleWalletIds?: string[]): Reminder[] {
    if (!reminders || !user) return [];
    
    return reminders.filter(reminder => 
      this.canAccessReminder(reminder, user, accessibleWalletIds)
    );
  }

  /**
   * Get accessible wallet IDs for a user
   */
  static getAccessibleWalletIds(wallets: Wallet[], user: User, familyMemberships?: FamilyWalletMember[]): string[] {
    const accessibleWallets = this.filterAccessibleWallets(wallets, user, familyMemberships);
    return accessibleWallets.map(wallet => wallet.id);
  }

  /**
   * Sanitize data to remove unauthorized information
   */
  static sanitizeWalletData(wallet: Wallet, user: User, familyMemberships?: FamilyWalletMember[]): Wallet | null {
    if (!this.canAccessWallet(wallet, user, familyMemberships)) {
      return null;
    }
    return wallet;
  }

  static sanitizeCategoryData(category: Category, user: User, accessibleWalletIds?: string[]): Category | null {
    if (!this.canAccessCategory(category, user, accessibleWalletIds)) {
      return null;
    }
    return category;
  }

  static sanitizeTransactionData(transaction: Transaction, user: User, accessibleWalletIds?: string[]): Transaction | null {
    if (!this.canAccessTransaction(transaction, user, accessibleWalletIds)) {
      return null;
    }
    return transaction;
  }

  /**
   * Validate form data before submission
   */
  static validateWalletFormAccess(walletId: string | undefined, user: User, accessibleWalletIds: string[]): boolean {
    if (!walletId) return true; // New wallet creation
    return accessibleWalletIds.includes(walletId);
  }

  static validateCategoryFormAccess(categoryId: string | undefined, walletId: string | undefined, user: User, accessibleWalletIds: string[]): boolean {
    // For new categories
    if (!categoryId) {
      // If wallet_id is specified, user must have access to it
      if (walletId) {
        return accessibleWalletIds.includes(walletId);
      }
      return true; // Personal category
    }
    
    // For existing categories, this should be validated by the backend
    return true;
  }

  static validateTransactionFormAccess(transactionId: string | undefined, walletId: string, categoryId: string | undefined, user: User, accessibleWalletIds: string[], accessibleCategoryIds: string[]): boolean {
    // Validate wallet access
    if (!accessibleWalletIds.includes(walletId)) {
      return false;
    }

    // Validate category access if specified
    if (categoryId && !accessibleCategoryIds.includes(categoryId)) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can perform bulk operations
   */
  static canPerformBulkOperation(resourceIds: string[], accessibleResourceIds: string[]): boolean {
    return resourceIds.every(id => accessibleResourceIds.includes(id));
  }

  /**
   * Generate error messages for access violations
   */
  static getAccessDeniedMessage(resourceType: string): string {
    return `You don't have permission to access this ${resourceType}.`;
  }

  static getModificationDeniedMessage(resourceType: string): string {
    return `You don't have permission to modify this ${resourceType}.`;
  }

  /**
   * Log access violations for security monitoring
   */
  static logAccessViolation(user: User, action: string, resourceType: string, resourceId: string): void {
    console.warn('ACCESS VIOLATION:', {
      userId: user.id,
      username: user.username,
      action,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString()
    });
    
    // In a production environment, you would want to:
    // 1. Send this to a security monitoring service
    // 2. Store in local storage for later transmission
    // 3. Potentially lock the user's session
  }
}

/**
 * Hook-like utilities for React components
 */
export const useAccessControl = (user: User | null) => {
  return {
    canAccessWallet: (wallet: Wallet, familyMemberships?: FamilyWalletMember[]) => 
      user ? AccessControlService.canAccessWallet(wallet, user, familyMemberships) : false,
    
    canModifyWallet: (wallet: Wallet) => 
      user ? AccessControlService.canModifyWallet(wallet, user) : false,
    
    canAccessCategory: (category: Category, accessibleWalletIds?: string[]) => 
      user ? AccessControlService.canAccessCategory(category, user, accessibleWalletIds) : false,
    
    canModifyCategory: (category: Category) => 
      user ? AccessControlService.canModifyCategory(category, user) : false,
    
    canAccessTransaction: (transaction: Transaction, accessibleWalletIds?: string[]) => 
      user ? AccessControlService.canAccessTransaction(transaction, user, accessibleWalletIds) : false,
    
    canModifyTransaction: (transaction: Transaction, accessibleWalletIds?: string[]) => 
      user ? AccessControlService.canModifyTransaction(transaction, user, accessibleWalletIds) : false,
    
    canAccessBudget: (budget: Budget, accessibleWalletIds?: string[]) => 
      user ? AccessControlService.canAccessBudget(budget, user, accessibleWalletIds) : false,
    
    canAccessReminder: (reminder: Reminder, accessibleWalletIds?: string[]) => 
      user ? AccessControlService.canAccessReminder(reminder, user, accessibleWalletIds) : false,
    
    canModifyReminder: (reminder: Reminder) => 
      user ? AccessControlService.canModifyReminder(reminder, user) : false,
    
    isAdmin: () => user ? AccessControlService.isAdmin(user) : false,
    
    canManageFamilyWallet: (wallet: Wallet) => 
      user ? AccessControlService.canManageFamilyWallet(wallet, user) : false
  };
};