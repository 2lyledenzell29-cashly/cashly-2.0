import { Request, Response } from 'express';
import { FamilyWalletService } from '../services/FamilyWalletService';
import { ApiResponse, JWTPayload } from '../types';

export class FamilyWalletController {
  private familyWalletService: FamilyWalletService;

  constructor() {
    this.familyWalletService = new FamilyWalletService();
  }

  // Create a new family wallet
  createFamilyWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Wallet name is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      const wallet = await this.familyWalletService.createFamilyWallet(user.userId, name);

      const response: ApiResponse = {
        success: true,
        data: wallet
      };
      res.status(201).json(response);
    } catch (error: any) {
      this.handleError(res, error);
    }
  };

  // Get family wallet members
  getFamilyWalletMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { walletId } = req.params;

      const members = await this.familyWalletService.getFamilyWalletMembers(walletId, user.userId);

      const response: ApiResponse = {
        success: true,
        data: members
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error);
    }
  };

  // Invite user to family wallet
  inviteToFamilyWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { walletId } = req.params;
      const { inviteeEmail } = req.body;

      if (!inviteeEmail || typeof inviteeEmail !== 'string' || !inviteeEmail.includes('@')) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Valid invitee email is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      const invitation = await this.familyWalletService.inviteToFamilyWallet(
        walletId,
        user.userId,
        inviteeEmail.toLowerCase().trim()
      );

      const response: ApiResponse = {
        success: true,
        data: invitation
      };
      res.status(201).json(response);
    } catch (error: any) {
      this.handleError(res, error);
    }
  };

  // Accept family wallet invitation
  acceptInvitation = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { invitationId } = req.params;

      const membership = await this.familyWalletService.acceptInvitation(invitationId, user.userId);

      const response: ApiResponse = {
        success: true,
        data: membership
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error);
    }
  };

  // Decline family wallet invitation
  declineInvitation = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { invitationId } = req.params;

      const invitation = await this.familyWalletService.declineInvitation(invitationId, user.userId);

      const response: ApiResponse = {
        success: true,
        data: invitation
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error);
    }
  };

  // Get user's family wallets
  getUserFamilyWallets = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;

      const familyWallets = await this.familyWalletService.getUserFamilyWallets(user.userId);

      const response: ApiResponse = {
        success: true,
        data: familyWallets
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error);
    }
  };

  // Get user's pending invitations
  getUserPendingInvitations = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;

      const invitations = await this.familyWalletService.getUserPendingInvitations(user.userId);

      const response: ApiResponse = {
        success: true,
        data: invitations
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error);
    }
  };

  // Remove family wallet member
  removeFamilyWalletMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { walletId, memberId } = req.params;

      const success = await this.familyWalletService.removeFamilyWalletMember(
        walletId,
        memberId,
        user.userId
      );

      const response: ApiResponse = {
        success: true,
        data: { removed: success }
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error);
    }
  };

  // Get family wallet invitations (for owners)
  getFamilyWalletInvitations = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as JWTPayload;
      const { walletId } = req.params;

      const invitations = await this.familyWalletService.getFamilyWalletInvitations(walletId, user.userId);

      const response: ApiResponse = {
        success: true,
        data: invitations
      };
      res.status(200).json(response);
    } catch (error: any) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: any): void {
    console.error('FamilyWalletController Error:', error);

    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';

    if (typeof error.message === 'string') {
      switch (error.message) {
        case 'RESOURCE_NOT_FOUND':
          statusCode = 404;
          errorCode = 'RESOURCE_NOT_FOUND';
          message = 'Resource not found';
          break;
        case 'AUTH_RESOURCE_FORBIDDEN':
          statusCode = 403;
          errorCode = 'AUTH_RESOURCE_FORBIDDEN';
          message = 'Access forbidden';
          break;
        case 'WALLET_LIMIT_EXCEEDED':
          statusCode = 422;
          errorCode = 'WALLET_LIMIT_EXCEEDED';
          message = 'Wallet creation limit exceeded';
          break;
        case 'VALIDATION_NOT_FAMILY_WALLET':
          statusCode = 422;
          errorCode = 'VALIDATION_NOT_FAMILY_WALLET';
          message = 'Wallet is not a family wallet';
          break;
        case 'VALIDATION_USER_ALREADY_MEMBER':
          statusCode = 422;
          errorCode = 'VALIDATION_USER_ALREADY_MEMBER';
          message = 'User is already a member of this family wallet';
          break;
        case 'VALIDATION_INVITATION_ALREADY_EXISTS':
          statusCode = 422;
          errorCode = 'VALIDATION_INVITATION_ALREADY_EXISTS';
          message = 'Invitation already exists for this user';
          break;
        case 'VALIDATION_INVITATION_EXPIRED':
          statusCode = 422;
          errorCode = 'VALIDATION_INVITATION_EXPIRED';
          message = 'Invitation has expired or is no longer valid';
          break;
        case 'VALIDATION_INVITATION_ALREADY_PROCESSED':
          statusCode = 422;
          errorCode = 'VALIDATION_INVITATION_ALREADY_PROCESSED';
          message = 'Invitation has already been processed';
          break;
        case 'VALIDATION_CANNOT_REMOVE_OWNER':
          statusCode = 422;
          errorCode = 'VALIDATION_CANNOT_REMOVE_OWNER';
          message = 'Cannot remove the owner of a family wallet';
          break;
      }
    }

    const response: ApiResponse = {
      success: false,
      error: {
        code: errorCode,
        message: message
      }
    };

    res.status(statusCode).json(response);
  }
}