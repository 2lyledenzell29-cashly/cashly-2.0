import { Request, Response } from 'express';
import { BudgetService } from '../services/BudgetService';
import { ApiResponse, CreateBudgetRequest, UpdateBudgetRequest } from '../types';

export class BudgetController {
  private budgetService: BudgetService;

  constructor() {
    this.budgetService = new BudgetService();
  }

  // GET /api/budgets - Get user's budgets
  getUserBudgets = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const budgets = await this.budgetService.getUserBudgets(userId);
      
      res.status(200).json({
        success: true,
        data: budgets
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/budgets/wallet/:walletId - Get budgets for specific wallet
  getWalletBudgets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletId } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const budgets = await this.budgetService.getWalletBudgets(walletId, userId);

      res.status(200).json({
        success: true,
        data: budgets
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/budgets/:id - Get specific budget
  getBudgetById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const budget = await this.budgetService.getBudgetById(id, userId);

      if (!budget) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Budget not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: budget
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // POST /api/budgets - Create new budget
  createBudget = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const budgetData: CreateBudgetRequest = req.body;

      // Validate required fields
      if (!budgetData.wallet_id || !budgetData.month || budgetData.limit === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Wallet ID, month, and limit are required'
          }
        } as ApiResponse);
        return;
      }

      // Validate limit is a positive number
      if (typeof budgetData.limit !== 'number' || budgetData.limit <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Budget limit must be a positive number'
          }
        } as ApiResponse);
        return;
      }

      // Validate month format
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(budgetData.month)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Month must be in YYYY-MM format'
          }
        } as ApiResponse);
        return;
      }

      const budget = await this.budgetService.createBudget(userId, budgetData);

      res.status(201).json({
        success: true,
        data: budget
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // PUT /api/budgets/:id - Update budget
  updateBudget = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const budgetData: UpdateBudgetRequest = req.body;

      // Validate limit if provided
      if (budgetData.limit !== undefined) {
        if (typeof budgetData.limit !== 'number' || budgetData.limit <= 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Budget limit must be a positive number'
            }
          } as ApiResponse);
          return;
        }
      }

      const budget = await this.budgetService.updateBudget(id, userId, budgetData);

      if (!budget) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Budget not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: budget
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // DELETE /api/budgets/:id - Delete budget
  deleteBudget = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const success = await this.budgetService.deleteBudget(id, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Budget not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Budget deleted successfully' }
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/budgets/:id/status - Get budget status with calculations
  getBudgetStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const budgetStatus = await this.budgetService.getBudgetStatus(id, userId);

      if (!budgetStatus) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Budget not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: budgetStatus
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/budgets/wallet/:walletId/current - Get current month budget status for wallet
  getCurrentMonthBudgetStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletId } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid authentication token'
          }
        } as ApiResponse);
        return;
      }

      const budgetStatus = await this.budgetService.getCurrentMonthBudgetStatus(walletId, userId);

      if (!budgetStatus) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'No budget found for current month'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: budgetStatus
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: any, res: Response): void {
    const errorMessage = error.message || 'INTERNAL_SERVER_ERROR';

    switch (errorMessage) {
      case 'RESOURCE_NOT_FOUND':
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Budget or wallet not found'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_INVALID_MONTH_FORMAT':
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_INVALID_MONTH_FORMAT',
            message: 'Month must be in YYYY-MM format'
          }
        } as ApiResponse);
        break;

      case 'BUDGET_ALREADY_EXISTS':
        res.status(422).json({
          success: false,
          error: {
            code: 'BUDGET_ALREADY_EXISTS',
            message: 'Budget already exists for this wallet and month'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_INVALID_BUDGET_LIMIT':
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_INVALID_BUDGET_LIMIT',
            message: 'Budget limit must be a positive number'
          }
        } as ApiResponse);
        break;

      default:
        console.error('Budget controller error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        } as ApiResponse);
        break;
    }
  }
}