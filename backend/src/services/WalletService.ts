import { v4 as uuidv4 } from 'uuid';
import { WalletRepository } from '../repositories/WalletRepository';
import { UserRepository } from '../repositories/UserRepository';
import { FamilyWalletMemberRepository } from '../repositories/FamilyWalletMemberRepository';
import { Wallet, CreateWalletRequest, UpdateWalletRequest } from '../types';

export class WalletService {
  private walletRepository: WalletRepository;
  private userRepository: UserRepository;
  private familyWalletMemberRepository: FamilyWalletMemberRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.userRepository = new UserRepository();
    this.familyWalletMemberRepository = new FamilyWalletMemberRepository();
  }

  async getUserWallets(userId: string): Promise<Wallet[]> {
    // Get user's own wallets
    const ownWallets = await this.walletRepository.findByUserId(userId);

    // Get family wallets user is a member of
    const familyWalletIds = await this.familyWalletMemberRepository.getUserFamilyWalletIds(userId);
    let familyWallets: Wallet[] = [];
    
    if (familyWalletIds.length > 0) {
      const wallets = await Promise.all(
        familyWalletIds.map(walletId => this.walletRepository.findById(walletId))
      );
      familyWallets = wallets.filter((wallet): wallet is Wallet => 
        wallet !== null && wallet.is_family
      );
    }

    // Combine and return all accessible wallets
    return [...ownWallets, ...familyWallets];
  }

  async getWalletById(walletId: string, userId: string): Promise<Wallet | null> {
    const wallet = await this.walletRepository.findById(walletId);
    
    if (!wallet) {
      return null;
    }

    // Check if user has access to this wallet (owns it or is a family member)
    const hasAccess = await this.validateWalletAccess(walletId, userId);
    if (!hasAccess) {
      return null;
    }
    
    return wallet;
  }

  async createWallet(userId: string, walletData: CreateWalletRequest): Promise<Wallet> {
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

    // Create wallet object
    const newWallet: Wallet = {
      id: uuidv4(),
      user_id: userId,
      name: walletData.name.trim(),
      is_default: isFirstWallet, // First wallet is automatically default
      is_family: walletData.is_family || false,
      created_at: new Date(),
      updated_at: new Date()
    };

    return this.walletRepository.create(newWallet);
  }

  async updateWallet(walletId: string, userId: string, walletData: UpdateWalletRequest): Promise<Wallet | null> {
    // Check if wallet exists and belongs to user
    const existingWallet = await this.getWalletById(walletId, userId);
    if (!existingWallet) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    const updateData = {
      ...walletData,
      updated_at: new Date()
    };

    // Trim name if provided
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    return this.walletRepository.update(walletId, updateData);
  }

  async deleteWallet(walletId: string, userId: string): Promise<boolean> {
    // Check if wallet exists and belongs to user
    const existingWallet = await this.getWalletById(walletId, userId);
    if (!existingWallet) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Check if this is the user's only wallet
    const userWalletCount = await this.walletRepository.countUserWallets(userId);
    if (userWalletCount <= 1) {
      throw new Error('VALIDATION_CANNOT_DELETE_LAST_WALLET');
    }

    // If deleting the default wallet, set another wallet as default
    if (existingWallet.is_default) {
      const userWallets = await this.walletRepository.findByUserId(userId);
      const otherWallet = userWallets.find(w => w.id !== walletId);
      
      if (otherWallet) {
        await this.walletRepository.setDefaultWallet(userId, otherWallet.id);
      }
    }

    return this.walletRepository.delete(walletId);
  }

  async setDefaultWallet(walletId: string, userId: string): Promise<Wallet | null> {
    // Check if wallet exists and belongs to user
    const wallet = await this.getWalletById(walletId, userId);
    if (!wallet) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    // Set as default wallet
    await this.walletRepository.setDefaultWallet(userId, walletId);

    // Return updated wallet
    return this.walletRepository.findById(walletId);
  }

  async getDefaultWallet(userId: string): Promise<Wallet | null> {
    return this.walletRepository.findDefaultWallet(userId);
  }

  async validateWalletOwnership(walletId: string, userId: string): Promise<boolean> {
    const wallet = await this.walletRepository.findById(walletId);
    return wallet !== null && wallet.user_id === userId;
  }

  async validateWalletAccess(walletId: string, userId: string): Promise<boolean> {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet) {
      return false;
    }

    // User owns the wallet
    if (wallet.user_id === userId) {
      return true;
    }

    // Check family wallet membership
    if (wallet.is_family) {
      const membership = await this.familyWalletMemberRepository.findMembership(walletId, userId);
      return membership !== null;
    }

    return false;
  }
}