import { WalletRepository } from '../repositories/WalletRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { FamilyWalletMemberRepository } from '../repositories/FamilyWalletMemberRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { Transaction } from '../types';

export interface DashboardSummary {
  total_balance: number;
  monthly_income: number;
  monthly_expense: number;
  budget_status: {
    total_budgets: number;
    budgets_on_track: number;
    budgets_warning: number;
    budgets_over: number;
    overall_status: 'green' | 'yellow' | 'orange' | 'red';
  };
  wallet_count: number;
  transaction_count: number;
}

export interface TransactionReportFilters {
  wallet_id?: string;
  category_id?: string;
  type?: 'Income' | 'Expense';
  start_date?: string;
  end_date?: string;
  page: number;
  limit: number;
}

export interface TransactionReport {
  transactions: Transaction[];
  summary: {
    total_income: number;
    total_expense: number;
    net_amount: number;
    transaction_count: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CategoryBreakdownFilters {
  wallet_id?: string;
  type?: 'Income' | 'Expense';
  start_date?: string;
  end_date?: string;
}

export interface CategoryBreakdownItem {
  category_id: string | null;
  category_name: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface CategoryBreakdown {
  breakdown: CategoryBreakdownItem[];
  total_amount: number;
  total_transactions: number;
}

export interface TrendsFilters {
  wallet_id?: string;
  period: 'monthly' | 'weekly';
  months: number;
}

export interface TrendDataPoint {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface TrendsReport {
  trends: TrendDataPoint[];
  period_type: 'monthly' | 'weekly';
  summary: {
    avg_income: number;
    avg_expense: number;
    avg_net: number;
    total_periods: number;
  };
}

export class DashboardService {
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;
  private budgetRepository: BudgetRepository;
  private familyWalletMemberRepository: FamilyWalletMemberRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
    this.budgetRepository = new BudgetRepository();
    this.familyWalletMemberRepository = new FamilyWalletMemberRepository();
    this.categoryRepository = new CategoryRepository();
  }

  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    // Get all wallets accessible to the user (owned + family wallets)
    const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
    
    // Calculate total balance across all wallets
    const totalBalance = await this.calculateTotalBalance(accessibleWalletIds);
    
    // Get current month's income and expense
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const monthlySummary = await this.transactionRepository.getSummaryByDateRange(
      userId,
      startOfMonth,
      endOfMonth,
      accessibleWalletIds
    );

    // Get budget status information
    const budgetStatus = await this.calculateBudgetStatus(accessibleWalletIds);
    
    // Get wallet and transaction counts
    const walletCount = accessibleWalletIds.length;
    const transactionCount = await this.getTransactionCount(userId, accessibleWalletIds);

    return {
      total_balance: totalBalance,
      monthly_income: monthlySummary.income,
      monthly_expense: monthlySummary.expense,
      budget_status: budgetStatus,
      wallet_count: walletCount,
      transaction_count: transactionCount
    };
  }

  private async getAccessibleWalletIds(userId: string): Promise<string[]> {
    // Get user's own wallets
    const ownWallets = await this.walletRepository.findByUserId(userId);
    const ownWalletIds = ownWallets.map(w => w.id);

    // Get family wallets the user is a member of
    const familyMemberships = await this.familyWalletMemberRepository.findByUserId(userId);
    const familyWalletIds = familyMemberships.map(m => m.wallet_id);

    // Combine and deduplicate
    const allWalletIds = [...new Set([...ownWalletIds, ...familyWalletIds])];
    return allWalletIds;
  }

  private async calculateTotalBalance(walletIds: string[]): Promise<number> {
    if (walletIds.length === 0) return 0;

    let totalBalance = 0;
    
    for (const walletId of walletIds) {
      const transactions = await this.transactionRepository.findByWalletId(walletId);
      const walletBalance = transactions.reduce((balance, transaction) => {
        return transaction.type === 'Income' 
          ? balance + transaction.amount 
          : balance - transaction.amount;
      }, 0);
      totalBalance += walletBalance;
    }

    return totalBalance;
  }

  private async calculateBudgetStatus(walletIds: string[]): Promise<DashboardSummary['budget_status']> {
    if (walletIds.length === 0) {
      return {
        total_budgets: 0,
        budgets_on_track: 0,
        budgets_warning: 0,
        budgets_over: 0,
        overall_status: 'green'
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    let totalBudgets = 0;
    let budgetsOnTrack = 0; // < 70%
    let budgetsWarning = 0; // 70-100%
    let budgetsOver = 0; // > 100%

    for (const walletId of walletIds) {
      const budget = await this.budgetRepository.findByWalletAndMonth(walletId, currentMonth);
      if (!budget) continue;

      totalBudgets++;

      // Calculate spent amount for this wallet in current month
      const startOfMonth = new Date(`${currentMonth}-01`);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
      
      const transactions = await this.transactionRepository.findByWalletAndDateRange(
        walletId,
        startOfMonth,
        endOfMonth,
        { type: 'Expense' }
      );

      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const percentageUsed = budget.limit > 0 ? (totalSpent / budget.limit) * 100 : 0;

      if (percentageUsed > 100) {
        budgetsOver++;
      } else if (percentageUsed >= 70) {
        budgetsWarning++;
      } else {
        budgetsOnTrack++;
      }
    }

    // Determine overall status
    let overallStatus: 'green' | 'yellow' | 'orange' | 'red' = 'green';
    if (budgetsOver > 0) {
      overallStatus = 'red';
    } else if (budgetsWarning > budgetsOnTrack) {
      overallStatus = 'orange';
    } else if (budgetsWarning > 0) {
      overallStatus = 'yellow';
    }

    return {
      total_budgets: totalBudgets,
      budgets_on_track: budgetsOnTrack,
      budgets_warning: budgetsWarning,
      budgets_over: budgetsOver,
      overall_status: overallStatus
    };
  }

  private async getTransactionCount(userId: string, walletIds: string[]): Promise<number> {
    if (walletIds.length === 0) return 0;

    const result = await this.transactionRepository.findWithFilters({
      user_id: userId
    });

    // Filter to only include transactions from accessible wallets
    const accessibleTransactions = result.filter(t => walletIds.includes(t.wallet_id));
    return accessibleTransactions.length;
  }

  async getTransactionReport(userId: string, filters: TransactionReportFilters): Promise<TransactionReport> {
    const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
    
    // Build transaction filters
    const transactionFilters: any = {
      user_id: userId
    };

    if (filters.wallet_id) {
      if (!accessibleWalletIds.includes(filters.wallet_id)) {
        throw new Error('Access denied to wallet');
      }
      transactionFilters.wallet_id = filters.wallet_id;
    }

    if (filters.category_id) {
      transactionFilters.category_id = filters.category_id;
    }

    if (filters.type) {
      transactionFilters.type = filters.type;
    }

    if (filters.start_date) {
      transactionFilters.start_date = new Date(filters.start_date);
    }

    if (filters.end_date) {
      transactionFilters.end_date = new Date(filters.end_date);
    }

    // Get paginated transactions
    const result = await this.transactionRepository.findWithPaginationAndFiltersForWallets(
      filters.page,
      filters.limit,
      transactionFilters,
      filters.wallet_id ? [filters.wallet_id] : accessibleWalletIds
    );

    // Calculate summary for all matching transactions (not just current page)
    const allTransactions = await this.transactionRepository.findWithFiltersForWallets(
      transactionFilters,
      filters.wallet_id ? [filters.wallet_id] : accessibleWalletIds
    );

    const totalIncome = allTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = allTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      transactions: result.data,
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        net_amount: totalIncome - totalExpense,
        transaction_count: allTransactions.length
      },
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / result.limit)
      }
    };
  }

  async getCategoryBreakdown(userId: string, filters: CategoryBreakdownFilters): Promise<CategoryBreakdown> {
    const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
    
    // Build transaction filters
    const transactionFilters: any = {
      user_id: userId
    };

    if (filters.wallet_id) {
      if (!accessibleWalletIds.includes(filters.wallet_id)) {
        throw new Error('Access denied to wallet');
      }
      transactionFilters.wallet_id = filters.wallet_id;
    }

    if (filters.type) {
      transactionFilters.type = filters.type;
    }

    if (filters.start_date) {
      transactionFilters.start_date = new Date(filters.start_date);
    }

    if (filters.end_date) {
      transactionFilters.end_date = new Date(filters.end_date);
    }

    // Get all matching transactions
    const transactions = await this.transactionRepository.findWithFiltersForWallets(
      transactionFilters,
      filters.wallet_id ? [filters.wallet_id] : accessibleWalletIds
    );

    // Group by category
    const categoryMap = new Map<string | null, { amount: number; count: number }>();
    
    for (const transaction of transactions) {
      const categoryId = transaction.category_id;
      const existing = categoryMap.get(categoryId) || { amount: 0, count: 0 };
      categoryMap.set(categoryId, {
        amount: existing.amount + transaction.amount,
        count: existing.count + 1
      });
    }

    // Get category names
    const categoryIds = Array.from(categoryMap.keys()).filter(id => id !== null) as string[];
    const categories = categoryIds.length > 0 
      ? await this.categoryRepository.findByIds(categoryIds)
      : [];

    const totalAmount = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.amount, 0);
    const totalTransactions = transactions.length;

    // Build breakdown
    const breakdown: CategoryBreakdownItem[] = [];
    
    for (const [categoryId, data] of categoryMap.entries()) {
      const category = categories.find(c => c.id === categoryId);
      const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;
      
      breakdown.push({
        category_id: categoryId,
        category_name: category?.name || 'Uncategorized',
        total_amount: data.amount,
        transaction_count: data.count,
        percentage: percentage
      });
    }

    // Sort by amount descending
    breakdown.sort((a, b) => b.total_amount - a.total_amount);

    return {
      breakdown,
      total_amount: totalAmount,
      total_transactions: totalTransactions
    };
  }

  async getTrends(userId: string, filters: TrendsFilters): Promise<TrendsReport> {
    const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
    
    if (filters.wallet_id && !accessibleWalletIds.includes(filters.wallet_id)) {
      throw new Error('Access denied to wallet');
    }

    const walletIds = filters.wallet_id ? [filters.wallet_id] : accessibleWalletIds;
    const trends: TrendDataPoint[] = [];
    
    const currentDate = new Date();
    
    for (let i = filters.months - 1; i >= 0; i--) {
      let startDate: Date;
      let endDate: Date;
      let periodLabel: string;

      if (filters.period === 'monthly') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
        periodLabel = startDate.toISOString().slice(0, 7); // YYYY-MM
      } else {
        // Weekly - get last N weeks
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - (i * 7) - currentDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        startDate = weekStart;
        endDate = weekEnd;
        periodLabel = `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`;
      }

      // Get transactions for this period
      const periodSummary = await this.transactionRepository.getSummaryByDateRange(
        userId,
        startDate,
        endDate,
        walletIds
      );

      trends.push({
        period: periodLabel,
        income: periodSummary.income,
        expense: periodSummary.expense,
        net: periodSummary.income - periodSummary.expense
      });
    }

    // Calculate averages
    const avgIncome = trends.reduce((sum, t) => sum + t.income, 0) / trends.length;
    const avgExpense = trends.reduce((sum, t) => sum + t.expense, 0) / trends.length;
    const avgNet = trends.reduce((sum, t) => sum + t.net, 0) / trends.length;

    return {
      trends,
      period_type: filters.period,
      summary: {
        avg_income: avgIncome,
        avg_expense: avgExpense,
        avg_net: avgNet,
        total_periods: trends.length
      }
    };
  }

  async getAccessibleCategories(userId: string): Promise<any[]> {
    const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
    
    // Get user's personal categories
    const personalCategories = await this.categoryRepository.findByUserId(userId);
    
    // Get family wallet categories
    const familyCategories: any[] = [];
    for (const walletId of accessibleWalletIds) {
      const walletCategories = await this.categoryRepository.findByWalletId(walletId);
      familyCategories.push(...walletCategories);
    }
    
    // Combine and deduplicate
    const allCategories = [...personalCategories, ...familyCategories];
    const uniqueCategories = allCategories.filter((category, index, self) => 
      index === self.findIndex(c => c.id === category.id)
    );
    
    return uniqueCategories;
  }

  async getAccessibleWallets(userId: string): Promise<any[]> {
    const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
    const wallets = [];
    
    for (const walletId of accessibleWalletIds) {
      const wallet = await this.walletRepository.findById(walletId);
      if (wallet) {
        wallets.push(wallet);
      }
    }
    
    return wallets;
  }

  async getSpendingTrendsChartData(userId: string, options: {
    wallet_id?: string;
    period: 'monthly' | 'weekly';
    months: number;
  }): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
  }> {
    const trends = await this.getTrends(userId, {
      wallet_id: options.wallet_id,
      period: options.period,
      months: options.months
    });

    const labels = trends.trends.map(t => t.period);
    const incomeData = trends.trends.map(t => t.income);
    const expenseData = trends.trends.map(t => t.expense);

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)'
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)'
        }
      ]
    };
  }

  async getCategoryPieChartData(userId: string, options: {
    wallet_id?: string;
    type?: 'Income' | 'Expense';
  }): Promise<{
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  }> {
    const breakdown = await this.getCategoryBreakdown(userId, {
      wallet_id: options.wallet_id,
      type: options.type || 'Expense'
    });

    const labels = breakdown.breakdown.map(item => item.category_name);
    const data = breakdown.breakdown.map(item => item.total_amount);
    
    // Generate colors for pie chart
    const colors = this.generateColors(labels.length);

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors
      }]
    };
  }

  async getIncomeExpenseBarChartData(userId: string, options: {
    wallet_id?: string;
    months: number;
  }): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
    }>;
  }> {
    const trends = await this.getTrends(userId, {
      wallet_id: options.wallet_id,
      period: 'monthly',
      months: options.months
    });

    const labels = trends.trends.map(t => t.period);
    const incomeData = trends.trends.map(t => t.income);
    const expenseData = trends.trends.map(t => t.expense);

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(34, 197, 94, 0.8)'
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        }
      ]
    };
  }

  async getBudgetProgressChartData(userId: string, options: {
    wallet_id?: string;
  }): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  }> {
    const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
    const walletIds = options.wallet_id ? [options.wallet_id] : accessibleWalletIds;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const labels: string[] = [];
    const spentData: number[] = [];
    const remainingData: number[] = [];
    const colors: string[] = [];

    for (const walletId of walletIds) {
      const wallet = await this.walletRepository.findById(walletId);
      const budget = await this.budgetRepository.findByWalletAndMonth(walletId, currentMonth);
      
      if (!budget || !wallet) continue;

      // Calculate spent amount
      const startOfMonth = new Date(`${currentMonth}-01`);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
      
      const transactions = await this.transactionRepository.findByWalletAndDateRange(
        walletId,
        startOfMonth,
        endOfMonth,
        { type: 'Expense' }
      );

      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = Math.max(0, budget.limit - totalSpent);
      const percentageUsed = budget.limit > 0 ? (totalSpent / budget.limit) * 100 : 0;

      labels.push(wallet.name);
      spentData.push(totalSpent);
      remainingData.push(remaining);

      // Color based on budget status
      if (percentageUsed > 100) {
        colors.push('rgba(239, 68, 68, 0.8)'); // Red
      } else if (percentageUsed >= 90) {
        colors.push('rgba(245, 158, 11, 0.8)'); // Orange
      } else if (percentageUsed >= 70) {
        colors.push('rgba(251, 191, 36, 0.8)'); // Yellow
      } else {
        colors.push('rgba(34, 197, 94, 0.8)'); // Green
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Spent',
          data: spentData,
          backgroundColor: colors
        },
        {
          label: 'Remaining',
          data: remainingData,
          backgroundColor: colors.map(color => color.replace('0.8', '0.3'))
        }
      ]
    };
  }

  private generateColors(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    
    return result;
  }
}