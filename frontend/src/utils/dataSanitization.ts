import { User, Wallet, Category, Transaction, Budget, Reminder, FamilyWalletMember } from '@/types';
import { AccessControlService } from './accessControl';
import { FamilyWalletAccessService } from './familyWalletAccess';

/**
 * Data sanitization utilities for frontend access control
 * These utilities ensure that unauthorized data is filtered out before display
 */

export class DataSanitizationService {
  /**
   * Sanitize wallet data to remove unauthorized information
   */
  static sanitizeWallets(
    wallets: Wallet[],
    user: User,
    familyMemberships: FamilyWalletMember[]
  ): Wallet[] {
    return wallets.filter(wallet => 
      AccessControlService.canAccessWallet(wallet, user, familyMemberships)
    );
  }

  /**
   * Sanitize category data to remove unauthorized information
   */
  static sanitizeCategories(
    categories: Category[],
    user: User,
    accessibleWalletIds: string[]
  ): Category[] {
    return categories.filter(category => 
      AccessControlService.canAccessCategory(category, user, accessibleWalletIds)
    );
  }

  /**
   * Sanitize transaction data to remove unauthorized information
   */
  static sanitizeTransactions(
    transactions: Transaction[],
    user: User,
    accessibleWalletIds: string[]
  ): Transaction[] {
    return transactions.filter(transaction => 
      AccessControlService.canAccessTransaction(transaction, user, accessibleWalletIds)
    );
  }

  /**
   * Sanitize budget data to remove unauthorized information
   */
  static sanitizeBudgets(
    budgets: Budget[],
    user: User,
    accessibleWalletIds: string[]
  ): Budget[] {
    return budgets.filter(budget => 
      AccessControlService.canAccessBudget(budget, user, accessibleWalletIds)
    );
  }

  /**
   * Sanitize reminder data to remove unauthorized information
   */
  static sanitizeReminders(
    reminders: Reminder[],
    user: User,
    accessibleWalletIds: string[]
  ): Reminder[] {
    return reminders.filter(reminder => 
      AccessControlService.canAccessReminder(reminder, user, accessibleWalletIds)
    );
  }

  /**
   * Sanitize family wallet member data
   */
  static sanitizeFamilyWalletMembers(
    members: FamilyWalletMember[],
    user: User,
    accessibleWalletIds: string[]
  ): FamilyWalletMember[] {
    return members.filter(member => 
      accessibleWalletIds.includes(member.wallet_id)
    );
  }

  /**
   * Remove sensitive information from user objects
   */
  static sanitizeUserData(userData: Partial<User>): Partial<User> {
    const { password_hash, ...sanitizedData } = userData as any;
    return sanitizedData;
  }

  /**
   * Sanitize API response data based on user permissions
   */
  static sanitizeApiResponse<T>(
    data: T,
    user: User,
    accessibleWalletIds: string[],
    familyMemberships: FamilyWalletMember[]
  ): T {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => 
        this.sanitizeApiResponse(item, user, accessibleWalletIds, familyMemberships)
      ) as T;
    }

    // Handle objects
    const sanitizedData = { ...data };

    // Sanitize based on object type
    if ('user_id' in sanitizedData && 'name' in sanitizedData && 'is_default' in sanitizedData) {
      // Wallet object
      const wallet = sanitizedData as unknown as Wallet;
      if (!AccessControlService.canAccessWallet(wallet, user, familyMemberships)) {
        return null as T;
      }
    } else if ('user_id' in sanitizedData && 'type' in sanitizedData && 'name' in sanitizedData) {
      // Category object
      const category = sanitizedData as unknown as Category;
      if (!AccessControlService.canAccessCategory(category, user, accessibleWalletIds)) {
        return null as T;
      }
    } else if ('wallet_id' in sanitizedData && 'amount' in sanitizedData && 'title' in sanitizedData) {
      // Transaction object
      const transaction = sanitizedData as unknown as Transaction;
      if (!AccessControlService.canAccessTransaction(transaction, user, accessibleWalletIds)) {
        return null as T;
      }
    } else if ('wallet_id' in sanitizedData && 'month' in sanitizedData && 'limit' in sanitizedData) {
      // Budget object
      const budget = sanitizedData as unknown as Budget;
      if (!AccessControlService.canAccessBudget(budget, user, accessibleWalletIds)) {
        return null as T;
      }
    } else if ('due_date' in sanitizedData && 'recurrence' in sanitizedData) {
      // Reminder object
      const reminder = sanitizedData as unknown as Reminder;
      if (!AccessControlService.canAccessReminder(reminder, user, accessibleWalletIds)) {
        return null as T;
      }
    }

    return sanitizedData;
  }

  /**
   * Sanitize form data before submission
   */
  static sanitizeFormData(
    formData: Record<string, any>,
    user: User,
    accessibleWalletIds: string[],
    accessibleCategoryIds: string[]
  ): { sanitizedData: Record<string, any>; violations: string[] } {
    const sanitizedData = { ...formData };
    const violations: string[] = [];

    // Validate wallet_id if present
    if (sanitizedData.wallet_id && !accessibleWalletIds.includes(sanitizedData.wallet_id)) {
      violations.push('Invalid wallet selection');
      delete sanitizedData.wallet_id;
    }

    // Validate category_id if present
    if (sanitizedData.category_id && !accessibleCategoryIds.includes(sanitizedData.category_id)) {
      violations.push('Invalid category selection');
      delete sanitizedData.category_id;
    }

    // Remove any user_id fields (should be set by backend)
    if (sanitizedData.user_id) {
      delete sanitizedData.user_id;
    }

    // Remove any created_by fields (should be set by backend)
    if (sanitizedData.created_by) {
      delete sanitizedData.created_by;
    }

    return { sanitizedData, violations };
  }

  /**
   * Sanitize query parameters for API calls
   */
  static sanitizeQueryParams(
    params: Record<string, any>,
    user: User,
    accessibleWalletIds: string[],
    accessibleCategoryIds: string[]
  ): { sanitizedParams: Record<string, any>; violations: string[] } {
    const sanitizedParams = { ...params };
    const violations: string[] = [];

    // Validate wallet_id filter
    if (sanitizedParams.wallet_id) {
      if (Array.isArray(sanitizedParams.wallet_id)) {
        const validWalletIds = sanitizedParams.wallet_id.filter((id: string) => 
          accessibleWalletIds.includes(id)
        );
        if (validWalletIds.length !== sanitizedParams.wallet_id.length) {
          violations.push('Some wallet filters were removed due to access restrictions');
        }
        sanitizedParams.wallet_id = validWalletIds;
      } else if (!accessibleWalletIds.includes(sanitizedParams.wallet_id)) {
        violations.push('Wallet filter removed due to access restrictions');
        delete sanitizedParams.wallet_id;
      }
    }

    // Validate category_id filter
    if (sanitizedParams.category_id) {
      if (Array.isArray(sanitizedParams.category_id)) {
        const validCategoryIds = sanitizedParams.category_id.filter((id: string) => 
          accessibleCategoryIds.includes(id)
        );
        if (validCategoryIds.length !== sanitizedParams.category_id.length) {
          violations.push('Some category filters were removed due to access restrictions');
        }
        sanitizedParams.category_id = validCategoryIds;
      } else if (!accessibleCategoryIds.includes(sanitizedParams.category_id)) {
        violations.push('Category filter removed due to access restrictions');
        delete sanitizedParams.category_id;
      }
    }

    // Remove user_id filters for non-admin users
    if (sanitizedParams.user_id && !AccessControlService.isAdmin(user)) {
      violations.push('User filter removed - admin access required');
      delete sanitizedParams.user_id;
    }

    return { sanitizedParams, violations };
  }

  /**
   * Sanitize dashboard data to ensure user only sees authorized information
   */
  static sanitizeDashboardData(
    dashboardData: {
      summary?: any;
      transactions?: Transaction[];
      budgets?: Budget[];
      reminders?: Reminder[];
      categories?: Category[];
      wallets?: Wallet[];
    },
    user: User,
    accessibleWalletIds: string[],
    familyMemberships: FamilyWalletMember[]
  ): typeof dashboardData {
    const sanitized = { ...dashboardData };

    if (sanitized.transactions) {
      sanitized.transactions = this.sanitizeTransactions(
        sanitized.transactions,
        user,
        accessibleWalletIds
      );
    }

    if (sanitized.budgets) {
      sanitized.budgets = this.sanitizeBudgets(
        sanitized.budgets,
        user,
        accessibleWalletIds
      );
    }

    if (sanitized.reminders) {
      sanitized.reminders = this.sanitizeReminders(
        sanitized.reminders,
        user,
        accessibleWalletIds
      );
    }

    if (sanitized.categories) {
      sanitized.categories = this.sanitizeCategories(
        sanitized.categories,
        user,
        accessibleWalletIds
      );
    }

    if (sanitized.wallets) {
      sanitized.wallets = this.sanitizeWallets(
        sanitized.wallets,
        user,
        familyMemberships
      );
    }

    return sanitized;
  }

  /**
   * Sanitize export data to ensure user only exports authorized information
   */
  static sanitizeExportData(
    exportData: any[],
    user: User,
    accessibleWalletIds: string[],
    dataType: 'transactions' | 'budgets' | 'categories' | 'reminders'
  ): any[] {
    switch (dataType) {
      case 'transactions':
        return this.sanitizeTransactions(exportData as Transaction[], user, accessibleWalletIds);
      case 'budgets':
        return this.sanitizeBudgets(exportData as Budget[], user, accessibleWalletIds);
      case 'categories':
        return this.sanitizeCategories(exportData as Category[], user, accessibleWalletIds);
      case 'reminders':
        return this.sanitizeReminders(exportData as Reminder[], user, accessibleWalletIds);
      default:
        return [];
    }
  }

  /**
   * Create a sanitized copy of data for display purposes
   */
  static createDisplayCopy<T>(
    data: T,
    user: User,
    accessibleWalletIds: string[],
    familyMemberships: FamilyWalletMember[]
  ): T | null {
    if (!data) return null;

    try {
      const sanitized = this.sanitizeApiResponse(
        JSON.parse(JSON.stringify(data)),
        user,
        accessibleWalletIds,
        familyMemberships
      );
      return sanitized;
    } catch (error) {
      console.error('Error creating sanitized display copy:', error);
      return null;
    }
  }

  /**
   * Validate and sanitize bulk operations
   */
  static sanitizeBulkOperation(
    resourceIds: string[],
    resourceType: 'wallets' | 'categories' | 'transactions' | 'budgets' | 'reminders',
    user: User,
    accessibleWalletIds: string[],
    accessibleCategoryIds: string[]
  ): { validIds: string[]; violations: string[] } {
    const violations: string[] = [];
    let validIds: string[] = [];

    switch (resourceType) {
      case 'wallets':
        validIds = resourceIds.filter(id => accessibleWalletIds.includes(id));
        break;
      case 'categories':
        validIds = resourceIds.filter(id => accessibleCategoryIds.includes(id));
        break;
      case 'transactions':
      case 'budgets':
      case 'reminders':
        // These are validated through their associated wallets
        validIds = resourceIds; // Backend will validate
        break;
      default:
        violations.push('Invalid resource type');
        return { validIds: [], violations };
    }

    if (validIds.length !== resourceIds.length) {
      violations.push(`${resourceIds.length - validIds.length} items removed due to access restrictions`);
    }

    return { validIds, violations };
  }

  /**
   * Log data sanitization violations for security monitoring
   */
  static logSanitizationViolation(
    user: User,
    violationType: string,
    resourceType: string,
    resourceId: string,
    details?: any
  ): void {
    console.warn('DATA SANITIZATION VIOLATION:', {
      userId: user.id,
      username: user.username,
      violationType,
      resourceType,
      resourceId,
      details,
      timestamp: new Date().toISOString()
    });
  }
}