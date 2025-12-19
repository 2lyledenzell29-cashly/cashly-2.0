import { Request, Response } from 'express';
import { MigrationService } from '../services/MigrationService';
import { 
  ApiResponse, 
  MigrationRequest, 
  MigrationResult, 
  MigrationStatus,
  PostMigrationAssociationRequest,
  JWTPayload 
} from '../types';

export class MigrationController {
  private migrationService: MigrationService;

  constructor() {
    this.migrationService = new MigrationService();
  }

  // POST /api/admin/migrate
  migrateLegacyData = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { legacy_data, default_user_id, default_type }: MigrationRequest = req.body;

      // Validate request
      if (!legacy_data || !Array.isArray(legacy_data) || legacy_data.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'legacy_data is required and must be a non-empty array'
          }
        } as ApiResponse);
        return;
      }

      // Validate each legacy transaction has required fields
      for (let i = 0; i < legacy_data.length; i++) {
        const transaction = legacy_data[i];
        if (!transaction.title || transaction.amount === undefined || !transaction.created_at) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: `Transaction at index ${i} is missing required fields (title, amount, created_at)`
            }
          } as ApiResponse);
          return;
        }
      }

      const result: MigrationResult = await this.migrationService.migrateLegacyData(
        legacy_data,
        user.userId,
        default_user_id,
        default_type
      );

      res.status(200).json({
        success: true,
        data: result
      } as ApiResponse<MigrationResult>);

    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MIGRATION_FAILED',
          message: error instanceof Error ? error.message : 'Migration failed with unknown error'
        }
      } as ApiResponse);
    }
  };

  // GET /api/admin/migrate/status/:id
  getMigrationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Migration ID is required'
          }
        } as ApiResponse);
        return;
      }

      const status: MigrationStatus | null = await this.migrationService.getMigrationStatus(id);

      if (!status) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Migration status not found'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: status
      } as ApiResponse<MigrationStatus>);

    } catch (error) {
      console.error('Get migration status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve migration status'
        }
      } as ApiResponse);
    }
  };

  // GET /api/admin/migrate/status
  getAllMigrationStatuses = async (req: Request, res: Response): Promise<void> => {
    try {
      const statuses: MigrationStatus[] = await this.migrationService.getAllMigrationStatuses();

      res.status(200).json({
        success: true,
        data: statuses
      } as ApiResponse<MigrationStatus[]>);

    } catch (error) {
      console.error('Get all migration statuses error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve migration statuses'
        }
      } as ApiResponse);
    }
  };

  // GET /api/admin/migrate/transactions
  getMigratedTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, wallet_id, legacy_id } = req.query;

      const filters = {
        user_id: user_id as string,
        wallet_id: wallet_id as string,
        is_migrated: true,
        legacy_id: legacy_id as string
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const transactions = await this.migrationService.getMigratedTransactions(filters);

      res.status(200).json({
        success: true,
        data: transactions
      } as ApiResponse);

    } catch (error) {
      console.error('Get migrated transactions error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve migrated transactions'
        }
      } as ApiResponse);
    }
  };

  // PUT /api/admin/migrate/transactions/:id/associate
  updateTransactionAssociation = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { id } = req.params;
      const updates: PostMigrationAssociationRequest = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Transaction ID is required'
          }
        } as ApiResponse);
        return;
      }

      // Validate at least one field is being updated
      if (!updates.user_id && !updates.wallet_id && updates.category_id === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'At least one field (user_id, wallet_id, category_id) must be provided for update'
          }
        } as ApiResponse);
        return;
      }

      const updatedTransaction = await this.migrationService.updateTransactionAssociation(
        id,
        updates,
        user.userId
      );

      if (!updatedTransaction) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Transaction not found or update failed'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedTransaction
      } as ApiResponse);

    } catch (error) {
      console.error('Update transaction association error:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: error.message
          }
        } as ApiResponse);
        return;
      }

      if (error instanceof Error && error.message.includes('does not exist')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: error.message
          }
        } as ApiResponse);
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update transaction association'
        }
      } as ApiResponse);
    }
  };

  // POST /api/admin/migrate/from-old-table
  migrateFromOldTable = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { placeholder_user_id, placeholder_wallet_id, filter_by_user_id } = req.body;

      const result: MigrationResult = await this.migrationService.migrateFromOldTransactionsTable(
        user.userId,
        placeholder_user_id || '00000000-0000-0000-0000-000000000001',
        placeholder_wallet_id || '11111111-1111-1111-1111-111111111111',
        filter_by_user_id
      );

      res.status(200).json({
        success: true,
        data: result
      } as ApiResponse<MigrationResult>);

    } catch (error) {
      console.error('Old table migration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MIGRATION_FAILED',
          message: error instanceof Error ? error.message : 'Migration from old table failed'
        }
      } as ApiResponse);
    }
  };
}