import { Request, Response } from 'express';
import { WalletService } from '../services/WalletService';
import { ApiResponse, CreateWalletRequest, UpdateWalletRequest } from '../types';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  // GET /api/wallets - Get user's wallets
  getUserWallets = async (req: Request, res: Response): Promise<void> => {
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

      const wallets = await this.walletService.getUserWallets(userId);
      
      res.status(200).json({
        success: true,
        data: wallets
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/wallets/:id - Get specific wallet
  getWalletById = async (req: Request, res: Response): Promise<void> => {
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

      const wallet = await this.walletService.getWalletById(id, userId);

      if (!wallet) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Wallet not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: wallet
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // POST /api/wallets - Create new wallet
  createWallet = async (req: Request, res: Response): Promise<void> => {
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

      const walletData: CreateWalletRequest = req.body;

      // Validate required fields
      if (!walletData.name || !walletData.name.trim()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Wallet name is required'
          }
        } as ApiResponse);
        return;
      }

      // Validate name length
      if (walletData.name.trim().length > 255) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Wallet name must be 255 characters or less'
          }
        } as ApiResponse);
        return;
      }

      const wallet = await this.walletService.createWallet(userId, walletData);

      res.status(201).json({
        success: true,
        data: wallet
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // PUT /api/wallets/:id - Update wallet
  updateWallet = async (req: Request, res: Response): Promise<void> => {
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

      const walletData: UpdateWalletRequest = req.body;

      // Validate name if provided
      if (walletData.name !== undefined) {
        if (!walletData.name || !walletData.name.trim()) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Wallet name cannot be empty'
            }
          } as ApiResponse);
          return;
        }

        if (walletData.name.trim().length > 255) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Wallet name must be 255 characters or less'
            }
          } as ApiResponse);
          return;
        }
      }

      const wallet = await this.walletService.updateWallet(id, userId, walletData);

      if (!wallet) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Wallet not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: wallet
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // DELETE /api/wallets/:id - Delete wallet
  deleteWallet = async (req: Request, res: Response): Promise<void> => {
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

      const success = await this.walletService.deleteWallet(id, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Wallet not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'Wallet deleted successfully' }
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // PUT /api/wallets/:id/set-default - Set wallet as default
  setDefaultWallet = async (req: Request, res: Response): Promise<void> => {
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

      const wallet = await this.walletService.setDefaultWallet(id, userId);

      if (!wallet) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Wallet not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: wallet
      } as ApiResponse);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // GET /api/wallets/default - Get user's default wallet
  getDefaultWallet = async (req: Request, res: Response): Promise<void> => {
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

      const wallet = await this.walletService.getDefaultWallet(userId);

      if (!wallet) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'No default wallet found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: wallet
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
            message: 'Wallet not found'
          }
        } as ApiResponse);
        break;

      case 'WALLET_LIMIT_EXCEEDED':
        res.status(422).json({
          success: false,
          error: {
            code: 'WALLET_LIMIT_EXCEEDED',
            message: 'Wallet creation limit exceeded'
          }
        } as ApiResponse);
        break;

      case 'VALIDATION_CANNOT_DELETE_LAST_WALLET':
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_CANNOT_DELETE_LAST_WALLET',
            message: 'Cannot delete the last wallet'
          }
        } as ApiResponse);
        break;

      default:
        console.error('Wallet controller error:', error);
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