import { MigrationRepository } from '../repositories/MigrationRepository';
import { 
  LegacyTransaction, 
  MigrationTransaction, 
  MigrationStatus, 
  MigrationRequest, 
  MigrationResult,
  PostMigrationAssociationRequest
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class MigrationService {
  private migrationRepository: MigrationRepository;

  constructor() {
    this.migrationRepository = new MigrationRepository();
  }

  async migrateLegacyData(
    legacyData: LegacyTransaction[], 
    adminUserId: string,
    defaultUserId?: string,
    defaultType: 'Income' | 'Expense' = 'Expense'
  ): Promise<MigrationResult> {
    // Create migration status record
    const migrationStatus = await this.migrationRepository.createMigrationStatus({
      status: 'in_progress',
      total_records: legacyData.length,
      processed_records: 0,
      successful_records: 0,
      failed_records: 0,
      started_at: new Date(),
      created_by: adminUserId
    });

    const errors: Array<{
      record_index: number;
      legacy_id?: string | number;
      error: string;
    }> = [];

    let successfulRecords = 0;
    let processedRecords = 0;

    try {
      // Process transactions in batches to avoid memory issues
      const batchSize = 100;
      const batches = this.chunkArray(legacyData, batchSize);

      for (const batch of batches) {
        const transactionsToInsert: Array<Omit<MigrationTransaction, 'id' | 'created_at' | 'updated_at'>> = [];

        for (let i = 0; i < batch.length; i++) {
          const legacyTransaction = batch[i];
          const recordIndex = processedRecords + i;

          try {
            // Validate and transform legacy transaction
            const migratedTransaction = await this.transformLegacyTransaction(
              legacyTransaction,
              defaultUserId,
              defaultType,
              adminUserId
            );

            if (migratedTransaction) {
              transactionsToInsert.push(migratedTransaction);
            } else {
              errors.push({
                record_index: recordIndex,
                legacy_id: legacyTransaction.id,
                error: 'Failed to transform legacy transaction'
              });
            }
          } catch (error) {
            errors.push({
              record_index: recordIndex,
              legacy_id: legacyTransaction.id,
              error: error instanceof Error ? error.message : 'Unknown error during transformation'
            });
          }
        }

        // Insert batch of transactions
        if (transactionsToInsert.length > 0) {
          try {
            await this.migrationRepository.insertMigratedTransactionsBatch(transactionsToInsert);
            successfulRecords += transactionsToInsert.length;
          } catch (error) {
            // If batch insert fails, try individual inserts
            for (const transaction of transactionsToInsert) {
              try {
                await this.migrationRepository.insertMigratedTransaction(transaction);
                successfulRecords++;
              } catch (individualError) {
                errors.push({
                  record_index: processedRecords,
                  legacy_id: transaction.legacy_id,
                  error: individualError instanceof Error ? individualError.message : 'Failed to insert transaction'
                });
              }
            }
          }
        }

        processedRecords += batch.length;

        // Update migration status periodically
        await this.migrationRepository.updateMigrationStatus(migrationStatus.id, {
          processed_records: processedRecords,
          successful_records: successfulRecords,
          failed_records: errors.length
        });
      }

      // Final status update
      const finalStatus = errors.length === 0 ? 'completed' : 
                         successfulRecords > 0 ? 'completed' : 'failed';

      await this.migrationRepository.updateMigrationStatus(migrationStatus.id, {
        status: finalStatus,
        processed_records: processedRecords,
        successful_records: successfulRecords,
        failed_records: errors.length,
        completed_at: new Date(),
        error_message: errors.length > 0 ? `${errors.length} records failed to migrate` : undefined
      });

      return {
        migration_id: migrationStatus.id,
        status: finalStatus,
        total_records: legacyData.length,
        successful_records: successfulRecords,
        failed_records: errors.length,
        errors
      };

    } catch (error) {
      // Update migration status to failed
      await this.migrationRepository.updateMigrationStatus(migrationStatus.id, {
        status: 'failed',
        processed_records: processedRecords,
        successful_records: successfulRecords,
        failed_records: errors.length,
        completed_at: new Date(),
        error_message: error instanceof Error ? error.message : 'Migration failed with unknown error'
      });

      throw error;
    }
  }

  private async transformLegacyTransaction(
    legacyTransaction: LegacyTransaction,
    defaultUserId?: string,
    defaultType: 'Income' | 'Expense' = 'Expense',
    adminUserId: string = ''
  ): Promise<Omit<MigrationTransaction, 'id' | 'created_at' | 'updated_at'> | null> {
    // Determine user ID
    let userId = legacyTransaction.user_id || defaultUserId;
    if (!userId) {
      throw new Error('No user ID specified and no default user provided');
    }

    // Validate user exists
    const userExists = await this.migrationRepository.validateUserExists(userId);
    if (!userExists) {
      throw new Error(`User with ID ${userId} does not exist`);
    }

    // Determine wallet ID - use default wallet if not specified
    let walletId = legacyTransaction.wallet_id;
    if (!walletId) {
      walletId = await this.migrationRepository.getUserDefaultWallet(userId);
      if (!walletId) {
        // If no default wallet, get the first wallet
        walletId = await this.migrationRepository.getUserFirstWallet(userId);
      }
      if (!walletId) {
        throw new Error(`No wallet found for user ${userId}`);
      }
    } else {
      // Validate wallet exists and belongs to user
      const walletExists = await this.migrationRepository.validateWalletExists(walletId);
      if (!walletExists) {
        throw new Error(`Wallet with ID ${walletId} does not exist`);
      }
      
      const walletOwnership = await this.migrationRepository.validateWalletOwnership(walletId, userId);
      if (!walletOwnership) {
        throw new Error(`Wallet ${walletId} does not belong to user ${userId}`);
      }
    }

    // Validate category if specified
    let categoryId: string | null = legacyTransaction.category_id || null;
    if (categoryId) {
      const categoryExists = await this.migrationRepository.validateCategoryExists(categoryId);
      if (!categoryExists) {
        // Mark as uncategorized if category doesn't exist
        categoryId = null;
      }
    }

    // Determine transaction type based on amount if not specified
    const amount = Math.abs(Number(legacyTransaction.amount));
    const type = amount >= 0 ? defaultType : (defaultType === 'Income' ? 'Expense' : 'Income');

    // Check if legacy ID already exists to prevent duplicates
    if (legacyTransaction.id) {
      const exists = await this.migrationRepository.checkLegacyIdExists(String(legacyTransaction.id));
      if (exists) {
        throw new Error(`Transaction with legacy ID ${legacyTransaction.id} already exists`);
      }
    }

    return {
      user_id: userId,
      wallet_id: walletId,
      category_id: categoryId,
      title: legacyTransaction.title || 'Migrated Transaction',
      amount: amount,
      type: type,
      created_by: adminUserId || userId,
      is_migrated: true,
      legacy_id: legacyTransaction.id ? String(legacyTransaction.id) : undefined
    };
  }

  async getMigrationStatus(migrationId: string): Promise<MigrationStatus | null> {
    return this.migrationRepository.getMigrationStatusById(migrationId);
  }

  async getAllMigrationStatuses(): Promise<MigrationStatus[]> {
    return this.migrationRepository.getAllMigrationStatuses();
  }

  async getMigrationStatusesByUser(userId: string): Promise<MigrationStatus[]> {
    return this.migrationRepository.getMigrationStatusesByUser(userId);
  }

  async getMigratedTransactions(filters?: {
    user_id?: string;
    wallet_id?: string;
    is_migrated?: boolean;
    legacy_id?: string;
  }): Promise<MigrationTransaction[]> {
    return this.migrationRepository.getMigratedTransactions(filters);
  }

  async updateTransactionAssociation(
    transactionId: string,
    updates: PostMigrationAssociationRequest,
    adminUserId: string
  ): Promise<MigrationTransaction | null> {
    // Validate transaction exists and is migrated
    const transaction = await this.migrationRepository.getTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (!transaction.is_migrated) {
      throw new Error('Can only update associations for migrated transactions');
    }

    // Validate updates
    const validatedUpdates: {
      user_id?: string;
      wallet_id?: string;
      category_id?: string | null;
    } = {};

    if (updates.user_id) {
      const userExists = await this.migrationRepository.validateUserExists(updates.user_id);
      if (!userExists) {
        throw new Error(`User with ID ${updates.user_id} does not exist`);
      }
      validatedUpdates.user_id = updates.user_id;
    }

    if (updates.wallet_id) {
      const walletExists = await this.migrationRepository.validateWalletExists(updates.wallet_id);
      if (!walletExists) {
        throw new Error(`Wallet with ID ${updates.wallet_id} does not exist`);
      }

      // If user_id is being updated, validate wallet ownership with new user
      const userId = updates.user_id || transaction.user_id;
      const walletOwnership = await this.migrationRepository.validateWalletOwnership(updates.wallet_id, userId);
      if (!walletOwnership) {
        throw new Error(`Wallet ${updates.wallet_id} does not belong to user ${userId}`);
      }
      validatedUpdates.wallet_id = updates.wallet_id;
    }

    if (updates.category_id !== undefined) {
      if (updates.category_id) {
        const categoryExists = await this.migrationRepository.validateCategoryExists(updates.category_id);
        if (!categoryExists) {
          throw new Error(`Category with ID ${updates.category_id} does not exist`);
        }
      }
      validatedUpdates.category_id = updates.category_id;
    }

    return this.migrationRepository.updateTransactionAssociation(transactionId, validatedUpdates);
  }

  async migrateFromOldTransactionsTable(
    adminUserId: string,
    placeholderUserId: string = '00000000-0000-0000-0000-000000000001',
    placeholderWalletId: string = '11111111-1111-1111-1111-111111111111',
    filterByUserId?: string
  ): Promise<MigrationResult> {
    // Create migration status record
    const migrationStatus = await this.migrationRepository.createMigrationStatus({
      status: 'in_progress',
      total_records: 0, // Will be updated after counting
      processed_records: 0,
      successful_records: 0,
      failed_records: 0,
      started_at: new Date(),
      created_by: adminUserId
    });

    try {
      // First, ensure placeholder user and wallet exist
      await this.ensurePlaceholderEntities(placeholderUserId, placeholderWalletId);

      // Count total records to migrate
      const totalRecords = await this.migrationRepository.countOldTransactions();
      
      await this.migrationRepository.updateMigrationStatus(migrationStatus.id, {
        total_records: totalRecords
      });

      if (totalRecords === 0) {
        await this.migrationRepository.updateMigrationStatus(migrationStatus.id, {
          status: 'completed',
          processed_records: 0,
          successful_records: 0,
          failed_records: 0,
          completed_at: new Date()
        });

        return {
          migration_id: migrationStatus.id,
          status: 'completed',
          total_records: 0,
          successful_records: 0,
          failed_records: 0,
          errors: []
        };
      }

      // Perform the migration
      const result = await this.migrationRepository.migrateOldTransactions(
        placeholderUserId,
        placeholderWalletId,
        adminUserId,
        filterByUserId
      );

      // Update final status
      await this.migrationRepository.updateMigrationStatus(migrationStatus.id, {
        status: 'completed',
        processed_records: result.migrated_count,
        successful_records: result.migrated_count,
        failed_records: 0,
        completed_at: new Date()
      });

      return {
        migration_id: migrationStatus.id,
        status: 'completed',
        total_records: totalRecords,
        successful_records: result.migrated_count,
        failed_records: 0,
        errors: []
      };

    } catch (error) {
      // Update migration status to failed
      await this.migrationRepository.updateMigrationStatus(migrationStatus.id, {
        status: 'failed',
        completed_at: new Date(),
        error_message: error instanceof Error ? error.message : 'Migration failed with unknown error'
      });

      throw error;
    }
  }

  private async ensurePlaceholderEntities(userId: string, walletId: string): Promise<void> {
    // Check if placeholder user exists, create if not
    const userExists = await this.migrationRepository.validateUserExists(userId);
    if (!userExists) {
      await this.migrationRepository.createPlaceholderUser(userId);
    }

    // Check if placeholder wallet exists, create if not
    const walletExists = await this.migrationRepository.validateWalletExists(walletId);
    if (!walletExists) {
      await this.migrationRepository.createPlaceholderWallet(walletId, userId);
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}