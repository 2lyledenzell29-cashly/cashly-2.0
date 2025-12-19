import { Router } from 'express';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import walletRoutes from './walletRoutes';
import categoryRoutes from './categoryRoutes';
import transactionRoutes from './transactionRoutes';
import budgetRoutes from './budgetRoutes';
import reminderRoutes from './reminderRoutes';
import dashboardRoutes from './dashboardRoutes';
import { familyWalletRoutes } from './familyWalletRoutes';

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount admin routes
router.use('/admin', adminRoutes);

// Mount wallet routes
router.use('/wallets', walletRoutes);

// Mount category routes
router.use('/categories', categoryRoutes);

// Mount transaction routes
router.use('/transactions', transactionRoutes);

// Mount budget routes
router.use('/budgets', budgetRoutes);

// Mount reminder routes
router.use('/reminders', reminderRoutes);

// Mount dashboard routes
router.use('/dashboard', dashboardRoutes);

// Mount family wallet routes
router.use('/family-wallets', familyWalletRoutes);

export default router;