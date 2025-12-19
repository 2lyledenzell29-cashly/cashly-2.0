import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { ApiResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  // GET /api/categories - Get user's categories
  getUserCategories = async (req: Request, res: Response): Promise<void> => {
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

      const { type } = req.query;
      const categoryType = type === 'Income' || type === 'Expense' ? type : undefined;

      const categories = await this.categoryService.getUserCategories(userId, categoryType);
      
      res.status(200).json({
        success: true,
        data: categories
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/categories/:id - Get specific category
  getCategoryById = async (req: Request, res: Response): Promise<void> => {
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

      const category = await this.categoryService.getCategoryById(id, userId);

      if (!category) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Category not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: category
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // POST /api/categories - Create new category
  createCategory = async (req: Request, res: Response): Promise<void> => {
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

      const categoryData: CreateCategoryRequest = req.body;

      // Validate required fields
      if (!categoryData.name || !categoryData.name.trim()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Category name is required'
          }
        } as ApiResponse);
        return;
      }

      if (!categoryData.type) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Category type is required'
          }
        } as ApiResponse);
        return;
      }

      // Validate category type
      if (!['Income', 'Expense'].includes(categoryData.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Category type must be either Income or Expense'
          }
        } as ApiResponse);
        return;
      }

      // Validate name length
      if (categoryData.name.trim().length > 255) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Category name must be 255 characters or less'
          }
        } as ApiResponse);
        return;
      }

      const category = await this.categoryService.createCategory(userId, categoryData);

      res.status(201).json({
        success: true,
        data: category
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // PUT /api/categories/:id - Update category
  updateCategory = async (req: Request, res: Response): Promise<void> => {
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

      const categoryData: UpdateCategoryRequest = req.body;

      // Validate name if provided
      if (categoryData.name !== undefined) {
        if (!categoryData.name || !categoryData.name.trim()) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Category name cannot be empty'
            }
          } as ApiResponse);
          return;
        }

        if (categoryData.name.trim().length > 255) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Category name must be 255 characters or less'
            }
          } as ApiResponse);
          return;
        }
      }

      // Validate type if provided
      if (categoryData.type && !['Income', 'Expense'].includes(categoryData.type)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Category type must be either Income or Expense'
          }
        } as ApiResponse);
        return;
      }

      const category = await this.categoryService.updateCategory(id, userId, categoryData);

      if (!category) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Category not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: category
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // DELETE /api/categories/:id - Delete category
  deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { force } = req.query; // Optional force parameter
      
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

      // Use the new method that handles transactions properly
      const result = await this.categoryService.deleteCategoryWithTransactionHandling(id, userId);

      if (!result.success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Category not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: { 
          message: 'Category deleted successfully',
          transactionsAffected: result.transactionsAffected
        }
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/categories/:id/transactions/count - Get transaction count for category
  getCategoryTransactionCount = async (req: Request, res: Response): Promise<void> => {
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

      const count = await this.categoryService.getCategoryTransactionCount(id, userId);

      res.status(200).json({
        success: true,
        data: { count }
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/categories/uncategorized/transactions - Get uncategorized transactions
  getUncategorizedTransactions = async (req: Request, res: Response): Promise<void> => {
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

      const transactions = await this.categoryService.getUncategorizedTransactions(userId);

      res.status(200).json({
        success: true,
        data: transactions
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
            message: 'Category not found'
          }
        } as ApiResponse);
        break;

      case 'WALLET_NOT_FOUND':
        res.status(404).json({
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Wallet not found or access denied'
          }
        } as ApiResponse);
        break;

      case 'CATEGORY_NAME_EXISTS':
        res.status(422).json({
          success: false,
          error: {
            code: 'CATEGORY_NAME_EXISTS',
            message: 'A category with this name already exists'
          }
        } as ApiResponse);
        break;

      case 'INVALID_CATEGORY_TYPE':
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY_TYPE',
            message: 'Category type must be either Income or Expense'
          }
        } as ApiResponse);
        break;



      default:
        console.error('Category controller error:', error);
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