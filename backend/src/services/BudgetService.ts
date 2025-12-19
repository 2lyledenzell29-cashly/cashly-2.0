import { v4 as uuidv4 } from 'uuid';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { FamilyWalletMemberRepository } from '../repositories/FamilyWalletMemberRepository';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest, BudgetStatus } from '../types';

export class BudgetService {
  private budgetRepository: BudgetRepository;
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;
  private familyWalletMemberRepository: FamilyWalletMemberRepository;

  constructor() {
    this.budgetRepository = new BudgetRepository();
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
    this.familyWalletMemberRepository = new FamilyWalletMemberRepository();
  }

  async getUserBudgets(userId: string): Promise<Budget[]> {
    // Get budgets for user's own wallets
    const ownBudgets = await this.budgetRepository.findBudgetsByUserId(userId);

    // Get budgets for family wallets user is a member of
    const familyWalletIds = await this.getFamilyWalletIds(userId);
    let familyBudgets: Budget[] = [];
    
    if (familyWalletIds.length > 0) {
      for (const walletId of familyWalletIds) {
        const walletBudgets = await this.budgetRepository.findByWalletId(walletId);
        familyBudgets.push(...walletBudgets);
      }
    }

    // Combine and return all accessible budgets
    return [...ownBudgets, ...familyBudgets];
  }

  async getWalletBudgets(walletId: string, userId: string): Promise<Budget[]> {
    // Verify wallet access (including family wallet membership)
    const hasAccess = await this.validateWalletAccess(walletId, userId);
    if (!hasAccess) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return this.budgetRepository.findByWalletId(walletId);
  }

  async getBudgetById(budgetId: string, userId: string): Promise<Budget | null> {
    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) {
      return null;
    }

    // Verify wallet access (including family wallet membership)
    const hasAccess = await this.validateWalletAccess(budget.wallet_id, userId);
    if (!hasAccess) {
      return null;
    }

    return budget;
  }

  async createBudget(userId: string, budgetData: CreateBudgetRequest): Promise<Budget> {
    // Verify wallet access (including family wallet membership)
    const hasAccess = await this.validateWalletAccess(budgetData.wallet_id, userId);
    if (!hasAccess) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(budgetData.month)) {
      throw new Error('VALIDATION_INVALID_MONTH_FORMAT');
    }

    // Check if budget already exists for this wallet and month
    const existingBudget = await this.budgetRepository.findByWalletAndMonth(
      budgetData.wallet_id,
      budgetData.month
    );
    if (existingBudget) {
      throw new Error('BUDGET_ALREADY_EXISTS');
    }

    // Validate limit is positive
    if (budgetData.limit <= 0) {
      throw new Error('VALIDATION_INVALID_BUDGET_LIMIT');
    }

    const newBudget: Budget = {
      id: uuidv4(),
      wallet_id: budgetData.wallet_id,
      month: budgetData.month,
      limit: budgetData.limit,
      created_at: new Date(),
      updated_at: new Date()
    };

    return this.budgetRepository.create(newBudget);
  }

  async updateBudget(budgetId: string, userId: string, budgetData: UpdateBudgetRequest): Promise<Budget | null> {
    // Check if budget exists and user has access
    const existingBudget = await this.getBudgetById(budgetId, userId);
    if (!existingBudget) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Validate limit if provided
    if (budgetData.limit !== undefined && budgetData.limit <= 0) {
      throw new Error('VALIDATION_INVALID_BUDGET_LIMIT');
    }

    const updateData = {
      ...budgetData,
      updated_at: new Date()
    };

    return this.budgetRepository.update(budgetId, updateData);
  }

  async deleteBudget(budgetId: string, userId: string): Promise<boolean> {
    // Check if budget exists and user has access
    const existingBudget = await this.getBudgetById(budgetId, userId);
    if (!existingBudget) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return this.budgetRepository.delete(budgetId);
  }

  async getBudgetStatus(budgetId: string, userId: string): Promise<BudgetStatus | null> {
    // Get budget and verify access
    const budget = await this.getBudgetById(budgetId, userId);
    if (!budget) {
      return null;
    }

    // Calculate total spent for the budget month
    const totalSpent = await this.calculateMonthlySpent(budget.wallet_id, budget.month);

    // Calculate remaining and percentage
    const remaining = budget.limit - totalSpent;
    const percentageUsed = budget.limit > 0 ? (totalSpent / budget.limit) * 100 : 0;

    // Determine status based on percentage used
    let status: 'green' | 'yellow' | 'orange' | 'red';
    if (percentageUsed < 70) {
      status = 'green';
    } else if (percentageUsed < 90) {
      status = 'yellow';
    } else if (percentageUsed <= 100) {
      status = 'orange';
    } else {
      status = 'red';
    }

    return {
      budget,
      total_spent: totalSpent,
      remaining,
      percentage_used: Math.round(percentageUsed * 100) / 100, // Round to 2 decimal places
      status
    };
  }

  async getCurrentMonthBudgetStatus(walletId: string, userId: string): Promise<BudgetStatus | null> {
    // Verify wallet access (including family wallet membership)
    const hasAccess = await this.validateWalletAccess(walletId, userId);
    if (!hasAccess) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Get current month budget
    const budget = await this.budgetRepository.findCurrentMonthBudget(walletId);
    if (!budget) {
      return null;
    }

    // Calculate status
    return this.getBudgetStatus(budget.id, userId);
  }

  private async calculateMonthlySpent(walletId: string, month: string): Promise<number> {
    // Parse month to get start and end dates
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1); // Month is 0-indexed
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999); // Last day of month

    // Get expense transactions for the month
    const transactions = await this.transactionRepository.findByWalletAndDateRange(
      walletId,
      startDate,
      endDate,
      { type: 'Expense' }
    );

    // Sum up the amounts
    return transactions.reduce((total, transaction) => total + transaction.amount, 0);
  }

  async validateBudgetOwnership(budgetId: string, userId: string): Promise<boolean> {
    const budget = await this.getBudgetById(budgetId, userId);
    return budget !== null;
  }

  private async validateWalletAccess(walletId: string, userId: string): Promise<boolean> {
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
}