import { v4 as uuidv4 } from 'uuid';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { FamilyWalletMemberRepository } from '../repositories/FamilyWalletMemberRepository';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

export class CategoryService {
  private categoryRepository: CategoryRepository;
  private walletRepository: WalletRepository;
  private familyWalletMemberRepository: FamilyWalletMemberRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
    this.walletRepository = new WalletRepository();
    this.familyWalletMemberRepository = new FamilyWalletMemberRepository();
  }

  async getUserCategories(userId: string, type?: 'Income' | 'Expense'): Promise<Category[]> {
    // Get user's personal categories
    let personalCategories: Category[];
    if (type) {
      personalCategories = await this.categoryRepository.findByUserIdAndType(userId, type);
    } else {
      personalCategories = await this.categoryRepository.findByUserId(userId);
    }

    // Get family wallet categories user has access to
    const familyWalletIds = await this.getFamilyWalletIds(userId);
    let familyCategories: Category[] = [];
    
    if (familyWalletIds.length > 0) {
      for (const walletId of familyWalletIds) {
        const walletCategories = await this.categoryRepository.findByWalletId(walletId);
        const filteredCategories = type ? walletCategories.filter(c => c.type === type) : walletCategories;
        familyCategories.push(...filteredCategories);
      }
    }

    // Combine and return all accessible categories
    return [...personalCategories, ...familyCategories];
  }

  async getCategoryById(categoryId: string, userId: string): Promise<Category | null> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      return null;
    }

    // Check if user has access to this category
    const hasAccess = await this.validateCategoryAccess(categoryId, userId);
    if (!hasAccess) {
      return null;
    }

    return category;
  }

  async createCategory(userId: string, categoryData: CreateCategoryRequest): Promise<Category> {
    // Validate wallet access if wallet_id is provided (for family wallets)
    if (categoryData.wallet_id) {
      const hasAccess = await this.validateWalletAccess(categoryData.wallet_id, userId);
      if (!hasAccess) {
        throw new Error('WALLET_NOT_FOUND');
      }
    }

    // Check for duplicate category name for the user (case-insensitive)
    const existingCategory = await this.categoryRepository.findByNameAndUser(
      categoryData.name,
      userId,
      categoryData.wallet_id
    );

    if (existingCategory) {
      throw new Error('CATEGORY_NAME_EXISTS');
    }

    // Validate category type
    if (!['Income', 'Expense'].includes(categoryData.type)) {
      throw new Error('INVALID_CATEGORY_TYPE');
    }

    // Create category object
    const newCategory: Category = {
      id: uuidv4(),
      user_id: userId,
      wallet_id: categoryData.wallet_id || null,
      name: categoryData.name.trim(),
      type: categoryData.type,
      created_at: new Date(),
      updated_at: new Date()
    };

    return this.categoryRepository.create(newCategory);
  }

  async updateCategory(categoryId: string, userId: string, categoryData: UpdateCategoryRequest): Promise<Category | null> {
    // Check if category exists and belongs to user
    const existingCategory = await this.getCategoryById(categoryId, userId);
    if (!existingCategory) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Validate category type if provided
    if (categoryData.type && !['Income', 'Expense'].includes(categoryData.type)) {
      throw new Error('INVALID_CATEGORY_TYPE');
    }

    // Check for duplicate name if name is being updated
    if (categoryData.name && categoryData.name.trim() !== existingCategory.name) {
      const duplicateCategory = await this.categoryRepository.findByNameAndUser(
        categoryData.name,
        userId,
        existingCategory.wallet_id
      );

      if (duplicateCategory && duplicateCategory.id !== categoryId) {
        throw new Error('CATEGORY_NAME_EXISTS');
      }
    }

    const updateData = {
      ...categoryData,
      updated_at: new Date()
    };

    // Trim name if provided
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    return this.categoryRepository.update(categoryId, updateData);
  }

  async deleteCategory(categoryId: string, userId: string, forceDelete: boolean = false): Promise<boolean> {
    // Check if category exists and belongs to user
    const existingCategory = await this.getCategoryById(categoryId, userId);
    if (!existingCategory) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Check if category has associated transactions
    const hasTransactions = await this.categoryRepository.hasTransactions(categoryId);
    
    if (hasTransactions && !forceDelete) {
      // Return information about transactions instead of throwing error
      throw new Error('CATEGORY_HAS_TRANSACTIONS');
    }

    // If forceDelete is true or no transactions exist, proceed with deletion
    // The database constraint will automatically set category_id to NULL for associated transactions
    return this.categoryRepository.delete(categoryId);
  }

  async validateCategoryOwnership(categoryId: string, userId: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(categoryId);
    return category !== null && category.user_id === userId;
  }

  async getCategoryTransactionCount(categoryId: string, userId: string): Promise<number> {
    // Verify ownership first
    const category = await this.getCategoryById(categoryId, userId);
    if (!category) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return this.categoryRepository.countTransactions(categoryId);
  }

  async getWalletCategories(walletId: string, userId: string): Promise<Category[]> {
    // Verify wallet access (including family wallet membership)
    const hasAccess = await this.validateWalletAccess(walletId, userId);
    if (!hasAccess) {
      throw new Error('WALLET_NOT_FOUND');
    }

    return this.categoryRepository.findByWalletId(walletId);
  }

  async getUncategorizedTransactions(userId: string): Promise<any[]> {
    return this.categoryRepository.getUncategorizedTransactions(userId);
  }

  async deleteCategoryWithTransactionHandling(categoryId: string, userId: string): Promise<{ success: boolean; transactionsAffected: number }> {
    // Check if category exists and belongs to user
    const existingCategory = await this.getCategoryById(categoryId, userId);
    if (!existingCategory) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Count transactions that will be affected
    const transactionCount = await this.categoryRepository.countTransactions(categoryId);

    // Delete the category - database constraint will handle setting transactions to uncategorized
    const success = await this.categoryRepository.delete(categoryId);

    return {
      success,
      transactionsAffected: transactionCount
    };
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

  private async validateCategoryAccess(categoryId: string, userId: string): Promise<boolean> {
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

  private async getFamilyWalletIds(userId: string): Promise<string[]> {
    const memberships = await this.familyWalletMemberRepository.findByUserId(userId);
    return memberships.map(membership => membership.wallet_id);
  }
}