import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middleware/authMiddleware';
import { validateUserDataAccess } from '../middleware/ownershipMiddleware';

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/dashboard/summary - Get dashboard summary
router.get('/summary', validateUserDataAccess(), (req, res) => dashboardController.getSummary(req, res));

// GET /api/dashboard/reports/transactions - Get transaction report with filtering and pagination
router.get('/reports/transactions', validateUserDataAccess(), (req, res) => dashboardController.getTransactionReport(req, res));

// GET /api/dashboard/reports/category-breakdown - Get category breakdown report
router.get('/reports/category-breakdown', validateUserDataAccess(), (req, res) => dashboardController.getCategoryBreakdown(req, res));

// GET /api/dashboard/reports/trends - Get spending trends report
router.get('/reports/trends', validateUserDataAccess(), (req, res) => dashboardController.getTrends(req, res));

// POST /api/dashboard/export/transactions - Export transactions to CSV or PDF
router.post('/export/transactions', validateUserDataAccess(), (req, res) => dashboardController.exportTransactions(req, res));

// POST /api/dashboard/export/category-breakdown - Export category breakdown to CSV
router.post('/export/category-breakdown', validateUserDataAccess(), (req, res) => dashboardController.exportCategoryBreakdown(req, res));

// POST /api/dashboard/export/trends - Export trends to CSV
router.post('/export/trends', validateUserDataAccess(), (req, res) => dashboardController.exportTrends(req, res));

// GET /api/dashboard/charts - Get chart data for visualization
router.get('/charts', validateUserDataAccess(), (req, res) => dashboardController.getChartData(req, res));

export default router;
