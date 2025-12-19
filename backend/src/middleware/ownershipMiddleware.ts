import { Request, Response, NextFunction } from 'express';
import { WalletRepository } from '../repositories/WalletRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { ReminderRepository } from '../repositories/ReminderRepository';
import { FamilyWalletMemberRepository } from '../repositories/FamilyWalletMemberRepository';
import { ApiResponse } from '../types';

export class OwnershipMiddleware {
  private walletRepository: WalletRepository;
  private categoryRepository: CategoryRepository;
  private transactionRepository: TransactionRepository;
  private budgetRepository: BudgetRepository;
  private reminderRepository: ReminderRepository;
  private familyWalletMemberRepository: FamilyWalletMemberRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.categoryRepository = new CategoryRepository();
    this.transactionRepository = new TransactionRepository();
    this.budgetRepository = new BudgetRepository();
    this.reminderRepository = new ReminderRepository();
    this.familyWalletMemberRepository = new FamilyWalletMemberRepository();
  }

  // Validate wallet ownership or family wallet membership
  validateWalletAccess = (paramName: string = 'id') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_TOKEN_INVALID',
              message: 'Authentication required'
            }
          } as ApiResponse);
          return;
        }

        const walletId = req.params[paramName] || req.body.wallet_id;
        if (!walletId) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Wallet ID is required'
            }
          } as ApiResponse);
          return;
        }

        const hasAccess = await this.checkWalletAccess(walletId, userId);
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            error: {
              code: 'AUTH_RESOURCE_FORBIDDEN',
              message: 'Access to this wallet is forbidden'
            }
          } as ApiResponse);
          return;
        }

        next();
      } catch (error) {
        console.error('Wallet ownership validation error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        } as ApiResponse);
      }
    };
  };

  // Validate category ownership or family wallet category access
  validateCategoryAccess = (paramName: string = 'id') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_TOKEN_INVALID',
              message: 'Authentication required'
            }
          } as ApiResponse);
          return;
        }

        const categoryId = req.params[paramName] || req.body.category_id;
        if (!categoryId) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Category ID is required'
            }
          } as ApiResponse);
          return;
        }

        const hasAccess = await this.checkCategoryAccess(categoryId, userId);
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            error: {
              code: 'AUTH_RESOURCE_FORBIDDEN',
              message: 'Access to this category is forbidden'
            }
          } as ApiResponse);
          return;
        }

        next();
      } catch (error) {
        console.error('Category ownership validation error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        } as ApiResponse);
      }
    };
  };

  // Validate transaction ownership or family wallet transaction access
  validateTransactionAccess = (paramName: string = 'id') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_TOKEN_INVALID',
              message: 'Authentication required'
            }
          } as ApiResponse);
          return;
        }

        const transactionId = req.params[paramName];
        if (!transactionId) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Transaction ID is required'
            }
          } as ApiResponse);
          return;
        }

        const hasAccess = await this.checkTransactionAccess(transactionId, userId);
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            error: {
              code: 'AUTH_RESOURCE_FORBIDDEN',
              message: 'Access to this transaction is forbidden'
            }
          } as ApiResponse);
          return;
        }

        next();
      } catch (error) {
        console.error('Transaction ownership validation error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        } as ApiResponse);
      }
    };
  };

  // Validate budget ownership or family wallet budget access
  validateBudgetAccess = (paramName: string = 'id') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_TOKEN_INVALID',
              message: 'Authentication required'
            }
          } as ApiResponse);
          return;
        }

        const budgetId = req.params[paramName];
        if (!budgetId) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Budget ID is required'
            }
          } as ApiResponse);
          return;
        }

        const hasAccess = await this.checkBudgetAccess(budgetId, userId);
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            error: {
              code: 'AUTH_RESOURCE_FORBIDDEN',
              message: 'Access to this budget is forbidden'
            }
          } as ApiResponse);
          return;
        }

        next();
      } catch (error) {
        console.error('Budget ownership validation error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        } as ApiResponse);
      }
    };
  };

  // Validate reminder ownership or family wallet reminder access
  validateReminderAccess = (paramName: string = 'id') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_TOKEN_INVALID',
              message: 'Authentication required'
            }
          } as ApiResponse);
          return;
        }

        const reminderId = req.params[paramName];
        if (!reminderId) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Reminder ID is required'
            }
          } as ApiResponse);
          return;
        }

        const hasAccess = await this.checkReminderAccess(reminderId, userId);
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            error: {
              code: 'AUTH_RESOURCE_FORBIDDEN',
              message: 'Access to this reminder is forbidden'
            }
          } as ApiResponse);
          return;
        }

        next();
      } catch (error) {
        console.error('Reminder ownership validation error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        } as ApiResponse);
      }
    };
  };

  // Validate that user can only access their own data in query parameters
  validateUserDataAccess = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_TOKEN_INVALID',
              message: 'Authentication required'
            }
          } as ApiResponse);
          return;
        }

        // Check if wallet_id in query params belongs to user
        if (req.query.wallet_id) {
          const walletId = req.query.wallet_id as string;
          const hasAccess = await this.checkWalletAccess(walletId, userId);
          if (!hasAccess) {
            res.status(403).json({
              success: false,
              error: {
                code: 'AUTH_RESOURCE_FORBIDDEN',
                message: 'Access to specified wallet is forbidden'
              }
            } as ApiResponse);
            return;
          }
        }

        // Check if category_id in query params belongs to user
        if (req.query.category_id) {
          const categoryId = req.query.category_id as string;
          const hasAccess = await this.checkCategoryAccess(categoryId, userId);
          if (!hasAccess) {
            res.status(403).json({
              success: false,
              error: {
                code: 'AUTH_RESOURCE_FORBIDDEN',
                message: 'Access to specified category is forbidden'
              }
            } as ApiResponse);
            return;
          }
        }

        next();
      } catch (error) {
        console.error('User data access validation error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        } as ApiResponse);
      }
    };
  };

  // Helper methods for access validation
  private async checkWalletAccess(walletId: string, userId: string): Promise<boolean> {
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

  private async checkCategoryAccess(categoryId: string, userId: string): Promise<boolean> {
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
      return this.checkWalletAccess(category.wallet_id, userId);
    }

    return false;
  }

  private async checkTransactionAccess(transactionId: string, userId: string): Promise<boolean> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      return false;
    }

    // User owns the transaction
    if (transaction.user_id === userId) {
      return true;
    }

    // Check if user has access to the wallet
    return this.checkWalletAccess(transaction.wallet_id, userId);
  }

  private async checkBudgetAccess(budgetId: string, userId: string): Promise<boolean> {
    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) {
      return false;
    }

    // Check if user has access to the wallet
    return this.checkWalletAccess(budget.wallet_id, userId);
  }

  private async checkReminderAccess(reminderId: string, userId: string): Promise<boolean> {
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
      return this.checkWalletAccess(reminder.wallet_id, userId);
    }

    return false;
  }
}

// Create singleton instance
const ownershipMiddleware = new OwnershipMiddleware();

// Export middleware functions
export const validateWalletAccess = ownershipMiddleware.validateWalletAccess;
export const validateCategoryAccess = ownershipMiddleware.validateCategoryAccess;
export const validateTransactionAccess = ownershipMiddleware.validateTransactionAccess;
export const validateBudgetAccess = ownershipMiddleware.validateBudgetAccess;
export const validateReminderAccess = ownershipMiddleware.validateReminderAccess;
export const validateUserDataAccess = ownershipMiddleware.validateUserDataAccess;