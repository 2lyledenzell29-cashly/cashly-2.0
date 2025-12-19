import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { MigrationController } from '../controllers/MigrationController';
import { 
  authenticate, 
  validateAdminAccess, 
  preventSelfAdminModification 
} from '../middleware/authMiddleware';
import { adminRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();
const userController = new UserController();
const migrationController = new MigrationController();

// Apply rate limiting, authentication and enhanced admin authorization to all admin routes
router.use(adminRateLimit.limit);
router.use(authenticate);
router.use(validateAdminAccess);

// User management routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.createUser);

// Routes that modify user data with additional protection
router.put('/users/:id', preventSelfAdminModification, userController.updateUser);
router.put('/users/:id/password', userController.resetPassword);
router.put('/users/:id/wallet-limit', userController.updateWalletLimit);
router.delete('/users/:id', userController.deleteUser);

// Migration routes
router.post('/migrate', migrationController.migrateLegacyData);
router.post('/migrate/from-old-table', migrationController.migrateFromOldTable);
router.get('/migrate/status', migrationController.getAllMigrationStatuses);
router.get('/migrate/status/:id', migrationController.getMigrationStatus);
router.get('/migrate/transactions', migrationController.getMigratedTransactions);
router.put('/migrate/transactions/:id/associate', migrationController.updateTransactionAssociation);

export default router;