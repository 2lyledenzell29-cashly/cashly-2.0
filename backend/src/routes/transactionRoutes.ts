import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { authenticate } from '../middleware/authMiddleware';
import { generalRateLimit } from '../middleware/rateLimitMiddleware';
import { validateTransactionAccess, validateUserDataAccess } from '../middleware/ownershipMiddleware';

const router = Router();
const transactionController = new TransactionController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply rate limiting
router.use(generalRateLimit.limit);

// GET /api/transactions/summary - Get transaction summary (must be before /:id route)
router.get('/summary', validateUserDataAccess(), transactionController.getTransactionSummary);

// GET /api/transactions - Get user's transactions with filtering and pagination
router.get('/', validateUserDataAccess(), transactionController.getUserTransactions);

// GET /api/transactions/:id - Get specific transaction
router.get('/:id', validateTransactionAccess(), transactionController.getTransactionById);

// POST /api/transactions - Create new transaction
router.post('/', transactionController.createTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', validateTransactionAccess(), transactionController.updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', validateTransactionAccess(), transactionController.deleteTransaction);

export default router;