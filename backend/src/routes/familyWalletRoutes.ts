import { Router } from 'express';
import { FamilyWalletController } from '../controllers/FamilyWalletController';
import { authenticate } from '../middleware/authMiddleware';
import { validateWalletAccess } from '../middleware/ownershipMiddleware';

const router = Router();
const familyWalletController = new FamilyWalletController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Family wallet management routes
router.post('/', familyWalletController.createFamilyWallet);
router.get('/user', familyWalletController.getUserFamilyWallets);
router.get('/:walletId/members', validateWalletAccess('walletId'), familyWalletController.getFamilyWalletMembers);
router.post('/:walletId/invite', validateWalletAccess('walletId'), familyWalletController.inviteToFamilyWallet);
router.delete('/:walletId/members/:memberId', validateWalletAccess('walletId'), familyWalletController.removeFamilyWalletMember);
router.get('/:walletId/invitations', validateWalletAccess('walletId'), familyWalletController.getFamilyWalletInvitations);

// Invitation management routes
router.get('/invitations/pending', familyWalletController.getUserPendingInvitations);
router.post('/invitations/:invitationId/accept', familyWalletController.acceptInvitation);
router.post('/invitations/:invitationId/decline', familyWalletController.declineInvitation);

export { router as familyWalletRoutes };