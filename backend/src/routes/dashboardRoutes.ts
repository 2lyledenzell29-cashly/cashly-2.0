import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/dashboard/summary - Get dashboard summary
router.get('/summary', (req, res) => dashboardController.getSummary(req, res));

// GET /api/dashboard/reports/transactions - Get transaction report with filtering and pagination
router.get('/reports/transactions', (req, res) => dashboardController.getTransactionReport(req, res));

// GET /api/dashboard/reports/category-breakdown - Get category breakdown report
router.get('/reports/category-breakdown', (req, res) => dashboardController.getCategoryBreakdown(req, res));

// GET /api/dashboard/reports/trends - Get spending trends report
router.get('/reports/trends', (req, res) => dashboardController.getTrends(req, res));

// POST /api/dashboard/export/transactions - Export transactions to CSV or PDF
router.post('/export/transactions', (req, res) => dashboardController.exportTransactions(req, res));

// POST /api/dashboard/export/category-breakdown - Export category breakdown to CSV
router.post('/export/category-breakdown', (req, res) => dashboardController.exportCategoryBreakdown(req, res));

// POST /api/dashboard/export/trends - Export trends to CSV
router.post('/export/trends', (req, res) => dashboardController.exportTrends(req, res));

// GET /api/dashboard/charts - Get chart data for visualization
router.get('/charts', (req, res) => dashboardController.getChartData(req, res));

export default router;
