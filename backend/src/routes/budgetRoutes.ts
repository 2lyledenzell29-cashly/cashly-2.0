import { Router } from 'express';
import { BudgetController } from '../controllers/BudgetController';
import { authenticate } from '../middleware/authMiddleware';
import { generalRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();
const budgetController = new BudgetController();

// Apply authentication middleware to all budget routes
router.use(authenticate);

// Apply rate limiting
router.use(generalRateLimit.limit);

// Budget CRUD routes
router.get('/', budgetController.getUserBudgets);
router.get('/wallet/:walletId', budgetController.getWalletBudgets);
router.get('/wallet/:walletId/current', budgetController.getCurrentMonthBudgetStatus);
router.get('/:id', budgetController.getBudgetById);
router.get('/:id/status', budgetController.getBudgetStatus);
router.post('/', budgetController.createBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;