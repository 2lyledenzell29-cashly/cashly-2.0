import { Router } from 'express';
import { WalletController } from '../controllers/WalletController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const walletController = new WalletController();

// Apply authentication middleware to all wallet routes
router.use(authenticate);

// GET /api/wallets - Get user's wallets
router.get('/', walletController.getUserWallets);

// GET /api/wallets/default - Get user's default wallet
router.get('/default', walletController.getDefaultWallet);

// GET /api/wallets/:id - Get specific wallet
router.get('/:id', walletController.getWalletById);

// POST /api/wallets - Create new wallet
router.post('/', walletController.createWallet);

// PUT /api/wallets/:id - Update wallet
router.put('/:id', walletController.updateWallet);

// PUT /api/wallets/:id/set-default - Set wallet as default
router.put('/:id/set-default', walletController.setDefaultWallet);

// DELETE /api/wallets/:id - Delete wallet
router.delete('/:id', walletController.deleteWallet);

export default router;