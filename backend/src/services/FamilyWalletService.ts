import { v4 as uuidv4 } from 'uuid';
import { FamilyWalletMemberRepository } from '../repositories/FamilyWalletMemberRepository';
import { InvitationRepository } from '../repositories/InvitationRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { UserRepository } from '../repositories/UserRepository';
import { FamilyWalletMember, Invitation, Wallet } from '../types';

export class FamilyWalletService {
  private familyWalletMemberRepository: FamilyWalletMemberRepository;
  private invitationRepository: InvitationRepository;
  private walletRepository: WalletRepository;
  private userRepository: UserRepository;

  constructor() {
    this.familyWalletMemberRepository = new FamilyWalletMemberRepository();
    this.invitationRepository = new InvitationRepository();
    this.walletRepository = new WalletRepository();
    this.userRepository = new UserRepository();
  }

  async createFamilyWallet(userId: string, name: string): Promise<Wallet> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Check wallet limit
    const currentWalletCount = await this.walletRepository.countUserWallets(userId);
    if (currentWalletCount >= user.wallet_limit) {
      throw new Error('WALLET_LIMIT_EXCEEDED');
    }

    // Check if this will be the user's first wallet (should be default)
    const isFirstWallet = currentWalletCount === 0;

    // Create family wallet
    const newWallet: Wallet = {
      id: uuidv4(),
      user_id: userId,
      name: name.trim(),
      is_default: isFirstWallet,
      is_family: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const createdWallet = await this.walletRepository.create(newWallet);

    // Add creator as owner in family wallet members
    await this.familyWalletMemberRepository.addMember(createdWallet.id, userId, 'owner');

    return createdWallet;
  }

  async getFamilyWalletMembers(walletId: string, userId: string): Promise<FamilyWalletMember[]> {
    // Verify user has access to this family wallet
    const hasAccess = await this.familyWalletMemberRepository.isWalletMember(walletId, userId);
    if (!hasAccess) {
      throw new Error('AUTH_RESOURCE_FORBIDDEN');
    }

    return this.familyWalletMemberRepository.getWalletMembers(walletId);
  }

  async inviteToFamilyWallet(walletId: string, inviterId: string, inviteeEmail: string): Promise<Invitation> {
    // Verify inviter is the owner of the family wallet
    const isOwner = await this.familyWalletMemberRepository.isWalletOwner(walletId, inviterId);
    if (!isOwner) {
      throw new Error('AUTH_RESOURCE_FORBIDDEN');
    }

    // Verify wallet is a family wallet
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet || !wallet.is_family) {
      throw new Error('VALIDATION_NOT_FAMILY_WALLET');
    }

    // Check if user is already a member
    const inviteeUser = await this.userRepository.findByEmail(inviteeEmail);
    if (inviteeUser) {
      const isMember = await this.familyWalletMemberRepository.isWalletMember(walletId, inviteeUser.id);
      if (isMember) {
        throw new Error('VALIDATION_USER_ALREADY_MEMBER');
      }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationRepository.findExistingInvitation(walletId, inviteeEmail);
    if (existingInvitation) {
      throw new Error('VALIDATION_INVITATION_ALREADY_EXISTS');
    }

    // Create invitation
    return this.invitationRepository.createInvitation(walletId, inviterId, inviteeEmail);
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<FamilyWalletMember> {
    // Get invitation
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Verify invitation is for this user's email
    const user = await this.userRepository.findById(userId);
    if (!user || user.email !== invitation.invitee_email) {
      throw new Error('AUTH_RESOURCE_FORBIDDEN');
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending' || invitation.expires_at < new Date()) {
      throw new Error('VALIDATION_INVITATION_EXPIRED');
    }

    // Check if user is already a member
    const isMember = await this.familyWalletMemberRepository.isWalletMember(invitation.wallet_id, userId);
    if (isMember) {
      throw new Error('VALIDATION_USER_ALREADY_MEMBER');
    }

    // Accept invitation
    await this.invitationRepository.acceptInvitation(invitationId);

    // Add user as member
    return this.familyWalletMemberRepository.addMember(invitation.wallet_id, userId, 'member');
  }

  async declineInvitation(invitationId: string, userId: string): Promise<Invitation> {
    // Get invitation
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Verify invitation is for this user's email
    const user = await this.userRepository.findById(userId);
    if (!user || user.email !== invitation.invitee_email) {
      throw new Error('AUTH_RESOURCE_FORBIDDEN');
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      throw new Error('VALIDATION_INVITATION_ALREADY_PROCESSED');
    }

    // Decline invitation
    const declinedInvitation = await this.invitationRepository.declineInvitation(invitationId);
    if (!declinedInvitation) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }

    return declinedInvitation;
  }

  async getUserFamilyWallets(userId: string): Promise<Wallet[]> {
    // Get all family wallet IDs where user is a member
    const familyWalletIds = await this.familyWalletMemberRepository.getUserFamilyWalletIds(userId);
    
    if (familyWalletIds.length === 0) {
      return [];
    }

    // Get wallet details for all family wallets
    const wallets = await Promise.all(
      familyWalletIds.map(walletId => this.walletRepository.findById(walletId))
    );

    // Filter out null results and ensure they are family wallets
    return wallets.filter((wallet): wallet is Wallet => 
      wallet !== null && wallet.is_family
    );
  }

  async getUserPendingInvitations(userId: string): Promise<Invitation[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return this.invitationRepository.findPendingInvitations(user.email);
  }

  async removeFamilyWalletMember(walletId: string, memberUserId: string, requesterId: string): Promise<boolean> {
    // Verify requester is the owner of the family wallet
    const isOwner = await this.familyWalletMemberRepository.isWalletOwner(walletId, requesterId);
    if (!isOwner) {
      throw new Error('AUTH_RESOURCE_FORBIDDEN');
    }

    // Cannot remove the owner
    const isTargetOwner = await this.familyWalletMemberRepository.isWalletOwner(walletId, memberUserId);
    if (isTargetOwner) {
      throw new Error('VALIDATION_CANNOT_REMOVE_OWNER');
    }

    // Remove member
    return this.familyWalletMemberRepository.removeMember(walletId, memberUserId);
  }

  async validateFamilyWalletAccess(walletId: string, userId: string): Promise<boolean> {
    return this.familyWalletMemberRepository.isWalletMember(walletId, userId);
  }

  async validateFamilyWalletOwnership(walletId: string, userId: string): Promise<boolean> {
    return this.familyWalletMemberRepository.isWalletOwner(walletId, userId);
  }

  async getFamilyWalletInvitations(walletId: string, userId: string): Promise<Invitation[]> {
    // Verify user is the owner of the family wallet
    const isOwner = await this.familyWalletMemberRepository.isWalletOwner(walletId, userId);
    if (!isOwner) {
      throw new Error('AUTH_RESOURCE_FORBIDDEN');
    }

    return this.invitationRepository.findByWalletId(walletId);
  }
}