import { WalletRepository } from '../repositories/WalletRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { ReminderRepository } from '../repositories/ReminderRepository';
import { FamilyWalletMemberRepository } from '../repositories/FamilyWalletMemberRepository';
import { UserRepository } from '../repositories/UserRepository';

export class DataIsolationService {
  private walletRepository: WalletRepository;
  private categoryRepository: CategoryRepository;
  private transactionRepository: TransactionRepository;
  private budgetRepository: BudgetRepository;
  private reminderRepository: ReminderRepository;
  private familyWalletMemberRepository: FamilyWalletMemberRepository;
  private userRepository: UserRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.categoryRepository = new CategoryRepository();
    this.transactionRepository = new TransactionRepository();
    this.budgetRepository = new BudgetRepository();
    this.reminderRepository = new ReminderRepository();
    this.familyWalletMemberRepository = new FamilyWalletMemberRepository();
    this.userRepository = new UserRepository();
  }

  // Comprehensive ownership validation methods
  async validateWalletOwnership(walletId: string, userId: string): Promise<boolean> {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet) {
      return false;
    }

    return wallet.user_id === userId;
  }

  async validateWalletAccess(walletId: string, userId: string): Promise<boolean> {
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

  async validateCategoryOwnership(categoryId: string, userId: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      return false;
    }

    return category.user_id === userId;
  }

  async validateCategoryAccess(categoryId: string, userId: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      return false;
    }

    // Personal category (belongs to user)
    if (category.user_id === userId && category.wallet_id === null) {
      return true;
    }

    // Family wallet category (user has access to the wallet)
    if (category.wallet_id) {
      return this.validateWalletAccess(category.wallet_id, userId);
    }

    return false;
  }

  async validateTransactionOwnership(transactionId: string, userId: string): Promise<boolean> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      return false;
    }

    return transaction.user_id === userId;
  }

  async validateTransactionAccess(transactionId: string, userId: string): Promise<boolean> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      return false;
    }

    // User owns the transaction
    if (transaction.user_id === userId) {
      return true;
    }

    // Check if user has access to the wallet
    return this.validateWalletAccess(transaction.wallet_id, userId);
  }

  async validateBudgetAccess(budgetId: string, userId: string): Promise<boolean> {
    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) {
      return false;
    }

    // Check if user has access to the wallet
    return this.validateWalletAccess(budget.wallet_id, userId);
  }

  async validateReminderOwnership(reminderId: string, userId: string): Promise<boolean> {
    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      return false;
    }

    return reminder.user_id === userId;
  }

  async validateReminderAccess(reminderId: string, userId: string): Promise<boolean> {
    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      return false;
    }

    // User owns the reminder
    if (reminder.user_id === userId) {
      return true;
    }

    // Check family wallet access if reminder is associated with a wallet
    if (reminder.wallet_id) {
      return this.validateWalletAccess(reminder.wallet_id, userId);
    }

    return false;
  }

  // Get accessible wallet IDs for a user (owned + family wallets)
  async getAccessibleWalletIds(userId: string): Promise<string[]> {
    // Get user's own wallets
    const ownWallets = await this.walletRepository.findByUserId(userId);
    const ownWalletIds = ownWallets.map(w => w.id);

    // Get family wallets user is a member of
    const familyMemberships = await this.familyWalletMemberRepository.findByUserId(userId);
    const familyWalletIds = familyMemberships.map(m => m.wallet_id);

    // Combine and deduplicate
    return [...new Set([...ownWalletIds, ...familyWalletIds])];
  }

  // Get accessible category IDs for a user (personal + family wallet categories)
  async getAccessibleCategoryIds(userId: string): Promise<string[]> {
    // Get user's personal categories
    const personalCategories = await this.categoryRepository.findByUserId(userId);
    const personalCategoryIds = personalCategories.map(c => c.id);

    // Get family wallet categories
    const familyWalletIds = await this.getFamilyWalletIds(userId);
    let familyCategoryIds: string[] = [];
    
    if (familyWalletIds.length > 0) {
      for (const walletId of familyWalletIds) {
        const walletCategories = await this.categoryRepository.findByWalletId(walletId);
        familyCategoryIds.push(...walletCategories.map(c => c.id));
      }
    }

    // Combine and deduplicate
    return [...new Set([...personalCategoryIds, ...familyCategoryIds])];
  }

  // Validate that user can only access their own data in bulk operations
  async validateBulkWalletAccess(walletIds: string[], userId: string): Promise<boolean> {
    const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
    return walletIds.every(id => accessibleWalletIds.includes(id));
  }

  async validateBulkCategoryAccess(categoryIds: string[], userId: string): Promise<boolean> {
    const accessibleCategoryIds = await this.getAccessibleCategoryIds(userId);
    return categoryIds.every(id => accessibleCategoryIds.includes(id));
  }

  // Validate admin-only operations
  async validateAdminAccess(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user !== null && user.role === 'admin';
  }

  // Prevent users from accessing other users' data through parameter manipulation
  async sanitizeUserIdParameter(requestedUserId: string, currentUserId: string, isAdmin: boolean = false): Promise<string> {
    // Admins can access any user's data
    if (isAdmin) {
      return requestedUserId;
    }

    // Non-admin users can only access their own data
    return currentUserId;
  }

  // Validate family wallet membership operations
  async validateFamilyWalletMembershipAccess(walletId: string, userId: string): Promise<boolean> {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet || !wallet.is_family) {
      return false;
    }

    // Only wallet owner can manage memberships
    return wallet.user_id === userId;
  }

  // Check if user is a family wallet member
  async isFamilyWalletMember(walletId: string, userId: string): Promise<boolean> {
    const membership = await this.familyWalletMemberRepository.findMembership(walletId, userId);
    return membership !== null;
  }

  // Get family wallet IDs for a user
  private async getFamilyWalletIds(userId: string): Promise<string[]> {
    const memberships = await this.familyWalletMemberRepository.findByUserId(userId);
    return memberships.map(membership => membership.wallet_id);
  }

  // Comprehensive data access validation for complex queries
  async validateComplexDataAccess(userId: string, filters: {
    walletIds?: string[];
    categoryIds?: string[];
    userIds?: string[];
  }): Promise<{ isValid: boolean; sanitizedFilters: typeof filters }> {
    const sanitizedFilters = { ...filters };

    // Validate wallet access
    if (filters.walletIds && filters.walletIds.length > 0) {
      const hasWalletAccess = await this.validateBulkWalletAccess(filters.walletIds, userId);
      if (!hasWalletAccess) {
        return { isValid: false, sanitizedFilters };
      }
    }

    // Validate category access
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      const hasCategoryAccess = await this.validateBulkCategoryAccess(filters.categoryIds, userId);
      if (!hasCategoryAccess) {
        return { isValid: false, sanitizedFilters };
      }
    }

    // Validate user access (only admins can query other users)
    if (filters.userIds && filters.userIds.length > 0) {
      const isAdmin = await this.validateAdminAccess(userId);
      if (!isAdmin) {
        // Non-admin users can only query their own data
        sanitizedFilters.userIds = [userId];
      }
    }

    return { isValid: true, sanitizedFilters };
  }

  // Log security violations for audit purposes
  async logSecurityViolation(userId: string, action: string, resourceType: string, resourceId: string, details?: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resourceType,
      resourceId,
      details,
      severity: 'WARNING'
    };

    console.warn('SECURITY VIOLATION:', JSON.stringify(logEntry, null, 2));
    
    // In a production environment, you would want to:
    // 1. Store this in a dedicated security log table
    // 2. Send alerts to security team
    // 3. Potentially trigger automated responses
  }

  // Validate resource existence and ownership in one call
  async validateResourceAccess(resourceType: 'wallet' | 'category' | 'transaction' | 'budget' | 'reminder', resourceId: string, userId: string): Promise<{
    exists: boolean;
    hasAccess: boolean;
    isOwner: boolean;
  }> {
    let exists = false;
    let hasAccess = false;
    let isOwner = false;

    switch (resourceType) {
      case 'wallet':
        exists = await this.walletRepository.exists(resourceId);
        hasAccess = exists && await this.validateWalletAccess(resourceId, userId);
        isOwner = exists && await this.validateWalletOwnership(resourceId, userId);
        break;

      case 'category':
        exists = await this.categoryRepository.exists(resourceId);
        hasAccess = exists && await this.validateCategoryAccess(resourceId, userId);
        isOwner = exists && await this.validateCategoryOwnership(resourceId, userId);
        break;

      case 'transaction':
        exists = await this.transactionRepository.exists(resourceId);
        hasAccess = exists && await this.validateTransactionAccess(resourceId, userId);
        isOwner = exists && await this.validateTransactionOwnership(resourceId, userId);
        break;

      case 'budget':
        exists = await this.budgetRepository.exists(resourceId);
        hasAccess = exists && await this.validateBudgetAccess(resourceId, userId);
        isOwner = false; // Budgets don't have direct ownership, only wallet access
        break;

      case 'reminder':
        exists = await this.reminderRepository.exists(resourceId);
        hasAccess = exists && await this.validateReminderAccess(resourceId, userId);
        isOwner = exists && await this.validateReminderOwnership(resourceId, userId);
        break;
    }

    return { exists, hasAccess, isOwner };
  }
}