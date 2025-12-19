import { Router } from 'express';
import { BudgetController } from '../controllers/BudgetController';
import { authenticate } from '../middleware/authMiddleware';
import { generalRateLimit } from '../middleware/rateLimitMiddleware';
import { validateBudgetAccess, validateWalletAccess } from '../middleware/ownershipMiddleware';

const router = Router();
const budgetController = new BudgetController();

// Apply authentication middleware to all budget routes
router.use(authenticate);

// Apply rate limiting
router.use(generalRateLimit.limit);

// Budget CRUD routes
router.get('/', budgetController.getUserBudgets);
router.get('/wallet/:walletId', validateWalletAccess('walletId'), budgetController.getWalletBudgets);
router.get('/wallet/:walletId/current', validateWalletAccess('walletId'), budgetController.getCurrentMonthBudgetStatus);
router.get('/:id', validateBudgetAccess(), budgetController.getBudgetById);
router.get('/:id/status', validateBudgetAccess(), budgetController.getBudgetStatus);
router.post('/', budgetController.createBudget);
router.put('/:id', validateBudgetAccess(), budgetController.updateBudget);
router.delete('/:id', validateBudgetAccess(), budgetController.deleteBudget);

export default router;