import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const categoryController = new CategoryController();

// Apply authentication middleware to all category routes
router.use(authenticate);

// GET /api/categories - Get user's categories (with optional type filter)
router.get('/', categoryController.getUserCategories);

// GET /api/categories/uncategorized/transactions - Get uncategorized transactions (must be before /:id route)
router.get('/uncategorized/transactions', categoryController.getUncategorizedTransactions);

// GET /api/categories/:id - Get specific category
router.get('/:id', categoryController.getCategoryById);

// POST /api/categories - Create new category
router.post('/', categoryController.createCategory);

// PUT /api/categories/:id - Update category
router.put('/:id', categoryController.updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', categoryController.deleteCategory);

// GET /api/categories/:id/transactions/count - Get transaction count for category
router.get('/:id/transactions/count', categoryController.getCategoryTransactionCount);

export default router;