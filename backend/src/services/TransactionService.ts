import { v4 as uuidv4 } from 'uuid';
import { TransactionRepository, TransactionFilters } from '../repositories/TransactionRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { FamilyWalletMemberRepository } from '../repositories/FamilyWalletMemberRepository';
import { Transaction, CreateTransactionRequest, UpdateTransactionRequest, TransactionSummary } from '../types';

export class TransactionService {
  private transactionRepository: TransactionRepository;
  private walletRepository: WalletRepository;
  private categoryRepository: CategoryRepository;
  private familyWalletMemberRepository: FamilyWalletMemberRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.walletRepository = new WalletRepository();
    this.categoryRepository = new CategoryRepository();
    this.familyWalletMemberRepository = new FamilyWalletMemberRepository();
  }

  async getUserTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: Omit<TransactionFilters, 'user_id'> = {}
  ): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> {
    // Get user's accessible wallets (owned + family wallets they're members of)
    const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
    
    // If wallet_id filter is provided, ensure user has access to it
    if (filters.wallet_id && !accessibleWalletIds.includes(filters.wallet_id)) {
      throw new Error('AUTH_RESOURCE_FORBIDDEN');
    }

    // Build filters with user's accessible wallets
    const transactionFilters: TransactionFilters = {
      ...filters,
      user_id: userId
    };

    // If no specific wallet filter, limit to accessible wallets
    if (!filters.wallet_id && accessibleWalletIds.length > 0) {
      // We'll handle this in the repository by modifying the query
      return this.transactionRepository.findWithPaginationAndFiltersForWallets(
        page,
        limit,
        transactionFilters,
        accessibleWalletIds
      );
    }

    return this.transactionRepository.findWithPaginationAndFilters(page, limit, transactionFilters);
  }

  async getTransactionById(transactionId: string, userId: string): Promise<Transaction | null> {
    const transaction = await this.transactionRepository.findById(transactionId);
    
    if (!transaction) {
      return null;
    }

    // Check if user has access to this transaction
    const hasAccess = await this.validateTransactionAccess(transaction, userId);
    if (!hasAccess) {
      return null;
    }
    
    return transaction;
  }

  async createTransaction(userId: string, transactionData: CreateTransactionRequest): Promise<Transaction> {
    // Determine wallet_id - use provided or default wallet
    let walletId = transactionData.wallet_id;
    
    if (!walletId) {
      const defaultWallet = await this.walletRepository.findDefaultWallet(userId);
      if (!defaultWallet) {
        throw new Error('VALIDATION_NO_DEFAULT_WALLET');
      }
      walletId = defaultWallet.id;
    }

    // Validate wallet access
    const hasWalletAccess = await this.validateWalletAccess(walletId, userId);
    if (!hasWalletAccess) {
      throw new Error('AUTH_RESOURCE_FORBIDDEN');
    }

    // Validate category access if provided
    if (transactionData.category_id) {
      const hasCategotyAccess = await this.validateCategoryAccess(transactionData.category_id, userId, walletId);
      if (!hasCategotyAccess) {
        throw new Error('AUTH_RESOURCE_FORBIDDEN');
      }
    }

    // Create transaction object
    const newTransaction: Transaction = {
      id: uuidv4(),
      user_id: userId,
      wallet_id: walletId,
      category_id: transactionData.category_id || null,
      title: transactionData.title.trim(),
      amount: transactionData.amount,
      type: transactionData.type,
      created_by: userId, // The user creating the transaction
      created_at: new Date(),
      updated_at: new Date()
    };

    return this.transactionRepository.create(newTransaction);
  }

  async updateTransaction(
    transactionId: string,
    userId: string,
    transactionData: UpdateTransactionRequest
  ): Promise<Transaction | null> {
    // Check if transaction exists and user has access
    const existingTransaction = await this.getTransactionById(transactionId, userId);
    if (!existingTransaction) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Validate wallet access if wallet_id is being changed
    if (transactionData.wallet_id && transactionData.wallet_id !== existingTransaction.wallet_id) {
      const hasWalletAccess = await this.validateWalletAccess(transactionData.wallet_id, userId);
      if (!hasWalletAccess) {
        throw new Error('AUTH_RESOURCE_FORBIDDEN');
      }
    }

    // Validate category access if category_id is being changed
    if (transactionData.category_id !== undefined && transactionData.category_id !== existingTransaction.category_id) {
      if (transactionData.category_id) {
        const targetWalletId = transactionData.wallet_id || existingTransaction.wallet_id;
        const hasCategoryAccess = await this.validateCategoryAccess(transactionData.category_id, userId, targetWalletId);
        if (!hasCategoryAccess) {
          throw new Error('AUTH_RESOURCE_FORBIDDEN');
        }
      }
    }

    const updateData = {
      ...transactionData,
      updated_at: new Date()
    };

    // Trim title if provided
    if (updateData.title) {
      updateData.title = updateData.title.trim();
    }

    return this.transactionRepository.update(transactionId, updateData);
  }

  async deleteTransaction(transactionId: string, userId: string): Promise<boolean> {
    // Check if transaction exists and user has access
    const existingTransaction = await this.getTransactionById(transactionId, userId);
    if (!existingTransaction) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return this.transactionRepository.delete(transactionId);
  }

  async getTransactionSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    walletIds?: string[]
  ): Promise<TransactionSummary> {
    // Get user's accessible wallets if no specific wallets provided
    let targetWalletIds = walletIds;
    if (!targetWalletIds) {
      targetWalletIds = await this.getAccessibleWalletIds(userId);
    } else {
      // Validate user has access to all provided wallet IDs
      const accessibleWalletIds = await this.getAccessibleWalletIds(userId);
      const hasAccessToAll = targetWalletIds.every(id => accessibleWalletIds.includes(id));
      if (!hasAccessToAll) {
        throw new Error('AUTH_RESOURCE_FORBIDDEN');
      }
    }

    // Set default date range if not provided (current month)
    if (!startDate || !endDate) {
      const now = new Date();
      startDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const summary = await this.transactionRepository.getSummaryByDateRange(
      userId,
      startDate,
      endDate,
      targetWalletIds
    );

    // Get total transaction count
    const filters: TransactionFilters = {
      user_id: userId,
      start_date: startDate,
      end_date: endDate
    };

    const { total } = await this.transactionRepository.findWithPaginationAndFiltersForWallets(
      1,
      1,
      filters,
      targetWalletIds
    );

    return {
      totalIncome: summary.income,
      totalExpense: summary.expense,
      balance: summary.income - summary.expense,
      transactionCount: total
    };
  }

  private async getAccessibleWalletIds(userId: string): Promise<string[]> {
    // Get user's own wallets
    const ownWallets = await this.walletRepository.findByUserId(userId);
    const ownWalletIds = ownWallets.map(w => w.id);

    // Get family wallets user is a member of
    const familyMemberships = await this.familyWalletMemberRepository.findByUserId(userId);
    const familyWalletIds = familyMemberships.map(m => m.wallet_id);

    // Combine and deduplicate
    return [...new Set([...ownWalletIds, ...familyWalletIds])];
  }

  private async validateTransactionAccess(transaction: Transaction, userId: string): Promise<boolean> {
    // User can access transaction if:
    // 1. They own the transaction (user_id matches)
    // 2. The transaction is in a wallet they have access to (own wallet or family wallet member)
    
    if (transaction.user_id === userId) {
      return true;
    }

    // Check if user has access to the wallet
    return this.validateWalletAccess(transaction.wallet_id, userId);
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

    // Check if user is a member of this family wallet
    if (wallet.is_family) {
      const membership = await this.familyWalletMemberRepository.findMembership(walletId, userId);
      return membership !== null;
    }

    return false;
  }

  private async validateCategoryAccess(categoryId: string, userId: string, walletId: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      return false;
    }

    // Personal category (belongs to user)
    if (category.user_id === userId && category.wallet_id === null) {
      return true;
    }

    // Family wallet category (belongs to the specific wallet and user has access to wallet)
    if (category.wallet_id === walletId) {
      return this.validateWalletAccess(walletId, userId);
    }

    return false;
  }
}