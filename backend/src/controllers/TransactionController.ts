import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { ApiResponse, CreateTransactionRequest, UpdateTransactionRequest, TransactionQueryParams } from '../types';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  // GET /api/transactions - Get user's transactions with filtering and pagination
  getUserTransactions = async (req: Request, res: Response): Promise<void> => {
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

      const {
        wallet_id,
        category_id,
        type,
        start_date,
        end_date,
        page = '1',
        limit = '10'
      } = req.query as TransactionQueryParams;

      // Parse and validate pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

      // Build filters
      const filters: any = {};
      if (wallet_id) filters.wallet_id = wallet_id;
      if (category_id) filters.category_id = category_id;
      if (type && (type === 'Income' || type === 'Expense')) filters.type = type;
      if (start_date) filters.start_date = new Date(start_date);
      if (end_date) filters.end_date = new Date(end_date);

      const result = await this.transactionService.getUserTransactions(
        userId,
        pageNum,
        limitNum,
        filters
      );

      res.status(200).json({
        success: true,
        data: result
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/transactions/:id - Get specific transaction
  getTransactionById = async (req: Request, res: Response): Promise<void> => {
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

      const transaction = await this.transactionService.getTransactionById(id, userId);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Transaction not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // POST /api/transactions - Create new transaction
  createTransaction = async (req: Request, res: Response): Promise<void> => {
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

      const transactionData: CreateTransactionRequest = req.body;

      // Validate required fields
      const validationError = this.validateCreateTransactionRequest(transactionData);
      if (validationError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: validationError
          }
        } as ApiResponse);
        return;
      }

      const transaction = await this.transactionService.createTransaction(userId, transactionData);

      res.status(201).json({
        success: true,
        data: transaction
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // PUT /api/transactions/:id - Update transaction
  updateTransaction = async (req: Request, res: Response): Promise<void> => {
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

      const transactionData: UpdateTransactionRequest = req.body;

      // Validate update data
      const validationError = this.validateUpdateTransactionRequest(transactionData);
      if (validationError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: validationError
          }
        } as ApiResponse);
        return;
      }

      const transaction = await this.transactionService.updateTransaction(id, userId, transactionData);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Transaction not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // DELETE /api/transactions/:id - Delete transaction
  deleteTransaction = async (req: Request, res: Response): Promise<void> => {
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

      const success = await this.transactionService.deleteTransaction(id, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Transaction not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Transaction deleted successfully' }
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/transactions/summary - Get transaction summary
  getTransactionSummary = async (req: Request, res: Response): Promise<void> => {
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

      const { start_date, end_date, wallet_ids } = req.query;

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let walletIdArray: string[] | undefined;

      if (start_date) {
        startDate = new Date(start_date as string);
        if (isNaN(startDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Invalid start_date format'
            }
          } as ApiResponse);
          return;
        }
      }

      if (end_date) {
        endDate = new Date(end_date as string);
        if (isNaN(endDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Invalid end_date format'
            }
          } as ApiResponse);
          return;
        }
      }

      if (wallet_ids) {
        if (typeof wallet_ids === 'string') {
          walletIdArray = wallet_ids.split(',').map(id => id.trim()).filter(id => id);
        } else if (Array.isArray(wallet_ids)) {
          walletIdArray = wallet_ids.map(id => String(id).trim()).filter(id => id);
        }
      }

      const summary = await this.transactionService.getTransactionSummary(
        userId,
        startDate,
        endDate,
        walletIdArray
      );

      res.status(200).json({
        success: true,
        data: summary
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private validateCreateTransactionRequest(data: CreateTransactionRequest): string | null {
    if (!data.title || !data.title.trim()) {
      return 'Transaction title is required';
    }

    if (data.title.trim().length > 255) {
      return 'Transaction title must be 255 characters or less';
    }

    if (typeof data.amount !== 'number' || data.amount <= 0) {
      return 'Transaction amount must be a positive number';
    }

    if (data.amount > 999999999.99) {
      return 'Transaction amount is too large';
    }

    if (!data.type || (data.type !== 'Income' && data.type !== 'Expense')) {
      return 'Transaction type must be either Income or Expense';
    }

    return null;
  }

  private validateUpdateTransactionRequest(data: UpdateTransactionRequest): string | null {
    if (data.title !== undefined) {
      if (!data.title || !data.title.trim()) {
        return 'Transaction title cannot be empty';
      }

      if (data.title.trim().length > 255) {
        return 'Transaction title must be 255 characters or less';
      }
    }

    if (data.amount !== undefined) {
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        return 'Transaction amount must be a positive number';
      }

      if (data.amount > 999999999.99) {
        return 'Transaction amount is too large';
      }
    }

    if (data.type !== undefined && data.type !== 'Income' && data.type !== 'Expense') {
      return 'Transaction type must be either Income or Expense';
    }

    return null;
  }

  private handleError(error: any, res: Response): void {
    const errorMessage = error.message || 'INTERNAL_SERVER_ERROR';

    switch (errorMessage) {
      case 'RESOURCE_NOT_FOUND':
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Transaction not found'
          }
        } as ApiResponse);
        break;

      case 'AUTH_RESOURCE_FORBIDDEN':
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_RESOURCE_FORBIDDEN',
            message: 'Access to this resource is forbidden'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_NO_DEFAULT_WALLET':
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_NO_DEFAULT_WALLET',
            message: 'No default wallet found. Please create a wallet first.'
          }
        } as ApiResponse);
        break;

      default:
        console.error('Transaction controller error:', error);
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