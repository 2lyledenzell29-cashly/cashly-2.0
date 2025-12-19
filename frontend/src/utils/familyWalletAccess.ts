import { User, Wallet, Category, Transaction, Budget, Reminder, FamilyWalletMember } from '@/types';

/**
 * Utilities for handling family wallet sharing exceptions
 * These functions handle the special access rules for family wallets
 */

export class FamilyWalletAccessService {
  /**
   * Check if a wallet is a family wallet that the user has access to
   */
  static isFamilyWalletMember(wallet: Wallet, user: User, familyMemberships: FamilyWalletMember[]): boolean {
    if (!wallet.is_family) return false;
    
    return familyMemberships.some(membership => 
      membership.wallet_id === wallet.id && 
      membership.user_id === user.id
    );
  }

  /**
   * Check if user is the owner of a family wallet
   */
  static isFamilyWalletOwner(wallet: Wallet, user: User): boolean {
    return wallet.is_family && wallet.user_id === user.id;
  }

  /**
   * Get the user's role in a family wallet
   */
  static getFamilyWalletRole(wallet: Wallet, user: User, familyMemberships: FamilyWalletMember[]): 'owner' | 'member' | null {
    if (!wallet.is_family) return null;
    
    // Check if user is the wallet owner
    if (wallet.user_id === user.id) return 'owner';
    
    // Check if user is a member
    const membership = familyMemberships.find(m => 
      m.wallet_id === wallet.id && m.user_id === user.id
    );
    
    return membership ? membership.role : null;
  }

  /**
   * Filter categories that are accessible through family wallet sharing
   */
  static getFamilyWalletCategories(categories: Category[], familyWalletIds: string[]): Category[] {
    return categories.filter(category => 
      category.wallet_id && familyWalletIds.includes(category.wallet_id)
    );
  }

  /**
   * Filter transactions that are accessible through family wallet sharing
   */
  static getFamilyWalletTransactions(transactions: Transaction[], familyWalletIds: string[]): Transaction[] {
    return transactions.filter(transaction => 
      familyWalletIds.includes(transaction.wallet_id)
    );
  }

  /**
   * Filter budgets that are accessible through family wallet sharing
   */
  static getFamilyWalletBudgets(budgets: Budget[], familyWalletIds: string[]): Budget[] {
    return budgets.filter(budget => 
      familyWalletIds.includes(budget.wallet_id)
    );
  }

  /**
   * Filter reminders that are accessible through family wallet sharing
   */
  static getFamilyWalletReminders(reminders: Reminder[], familyWalletIds: string[]): Reminder[] {
    return reminders.filter(reminder => 
      reminder.wallet_id && familyWalletIds.includes(reminder.wallet_id)
    );
  }

  /**
   * Get all wallet IDs that the user has access to (owned + family)
   */
  static getAllAccessibleWalletIds(wallets: Wallet[], user: User, familyMemberships: FamilyWalletMember[]): string[] {
    const ownedWalletIds = wallets
      .filter(wallet => wallet.user_id === user.id)
      .map(wallet => wallet.id);
    
    const familyWalletIds = familyMemberships
      .map(membership => membership.wallet_id);
    
    // Combine and deduplicate
    return [...new Set([...ownedWalletIds, ...familyWalletIds])];
  }

  /**
   * Get family wallet IDs that the user is a member of
   */
  static getFamilyWalletIds(familyMemberships: FamilyWalletMember[], userId: string): string[] {
    return familyMemberships
      .filter(membership => membership.user_id === userId)
      .map(membership => membership.wallet_id);
  }

  /**
   * Check if user can create resources in a family wallet
   */
  static canCreateInFamilyWallet(wallet: Wallet, user: User, familyMemberships: FamilyWalletMember[]): boolean {
    if (!wallet.is_family) return false;
    
    // Owner can always create
    if (wallet.user_id === user.id) return true;
    
    // Members can create if they have access
    return this.isFamilyWalletMember(wallet, user, familyMemberships);
  }

  /**
   * Check if user can modify resources in a family wallet
   */
  static canModifyInFamilyWallet(
    resourceCreatorId: string, 
    wallet: Wallet, 
    user: User, 
    familyMemberships: FamilyWalletMember[]
  ): boolean {
    if (!wallet.is_family) return false;
    
    // User created the resource
    if (resourceCreatorId === user.id) return true;
    
    // Wallet owner can modify any resource in their family wallet
    if (wallet.user_id === user.id) return true;
    
    // Regular members can only modify their own resources
    return false;
  }

  /**
   * Get sharing permissions for a resource
   */
  static getResourceSharingPermissions(
    resourceType: 'category' | 'transaction' | 'budget' | 'reminder',
    resourceCreatorId: string,
    walletId: string | null,
    user: User,
    wallets: Wallet[],
    familyMemberships: FamilyWalletMember[]
  ): {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    sharingReason: 'owner' | 'creator' | 'family_member' | 'none';
  } {
    // Default permissions
    let canView = false;
    let canEdit = false;
    let canDelete = false;
    let sharingReason: 'owner' | 'creator' | 'family_member' | 'none' = 'none';

    // User created the resource
    if (resourceCreatorId === user.id) {
      canView = true;
      canEdit = true;
      canDelete = true;
      sharingReason = 'creator';
      return { canView, canEdit, canDelete, sharingReason };
    }

    // Check family wallet sharing
    if (walletId) {
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet && wallet.is_family) {
        const role = this.getFamilyWalletRole(wallet, user, familyMemberships);
        
        if (role === 'owner') {
          canView = true;
          canEdit = true;
          canDelete = true;
          sharingReason = 'owner';
        } else if (role === 'member') {
          canView = true;
          // Members can edit/delete based on resource type and policies
          canEdit = resourceType === 'transaction' || resourceType === 'reminder';
          canDelete = resourceType === 'transaction' || resourceType === 'reminder';
          sharingReason = 'family_member';
        }
      }
    }

    return { canView, canEdit, canDelete, sharingReason };
  }

  /**
   * Filter data based on family wallet sharing rules
   */
  static filterSharedData<T extends { user_id?: string; wallet_id?: string | null; created_by?: string }>(
    data: T[],
    user: User,
    wallets: Wallet[],
    familyMemberships: FamilyWalletMember[]
  ): T[] {
    return data.filter(item => {
      // User owns the item
      if (item.user_id === user.id || item.created_by === user.id) {
        return true;
      }

      // Check family wallet sharing
      if (item.wallet_id) {
        const wallet = wallets.find(w => w.id === item.wallet_id);
        if (wallet && wallet.is_family) {
          return this.isFamilyWalletMember(wallet, user, familyMemberships);
        }
      }

      return false;
    });
  }

  /**
   * Get family wallet sharing context for UI display
   */
  static getFamilyWalletContext(
    wallet: Wallet,
    user: User,
    familyMemberships: FamilyWalletMember[]
  ): {
    isShared: boolean;
    userRole: 'owner' | 'member' | null;
    memberCount: number;
    canInvite: boolean;
    canManageMembers: boolean;
  } {
    if (!wallet.is_family) {
      return {
        isShared: false,
        userRole: null,
        memberCount: 0,
        canInvite: false,
        canManageMembers: false
      };
    }

    const userRole = this.getFamilyWalletRole(wallet, user, familyMemberships);
    const memberCount = familyMemberships.filter(m => m.wallet_id === wallet.id).length;
    const isOwner = userRole === 'owner';

    return {
      isShared: true,
      userRole,
      memberCount,
      canInvite: isOwner,
      canManageMembers: isOwner
    };
  }

  /**
   * Validate family wallet operations
   */
  static validateFamilyWalletOperation(
    operation: 'invite' | 'remove_member' | 'leave' | 'delete',
    wallet: Wallet,
    user: User,
    targetUserId?: string
  ): { isValid: boolean; reason?: string } {
    if (!wallet.is_family) {
      return { isValid: false, reason: 'Not a family wallet' };
    }

    const isOwner = wallet.user_id === user.id;

    switch (operation) {
      case 'invite':
        return {
          isValid: isOwner,
          reason: isOwner ? undefined : 'Only wallet owner can invite members'
        };

      case 'remove_member':
        if (!isOwner) {
          return { isValid: false, reason: 'Only wallet owner can remove members' };
        }
        if (targetUserId === user.id) {
          return { isValid: false, reason: 'Cannot remove yourself as owner' };
        }
        return { isValid: true };

      case 'leave':
        if (isOwner) {
          return { isValid: false, reason: 'Wallet owner cannot leave. Delete the wallet instead.' };
        }
        return { isValid: true };

      case 'delete':
        return {
          isValid: isOwner,
          reason: isOwner ? undefined : 'Only wallet owner can delete the wallet'
        };

      default:
        return { isValid: false, reason: 'Unknown operation' };
    }
  }

  /**
   * Get family wallet notification settings
   */
  static getFamilyWalletNotificationRules(
    wallet: Wallet,
    user: User,
    familyMemberships: FamilyWalletMember[]
  ): {
    shouldNotifyOnTransaction: boolean;
    shouldNotifyOnBudgetChange: boolean;
    shouldNotifyOnMemberJoin: boolean;
    shouldNotifyOnMemberLeave: boolean;
  } {
    const userRole = this.getFamilyWalletRole(wallet, user, familyMemberships);
    const isOwner = userRole === 'owner';

    return {
      shouldNotifyOnTransaction: true, // All members get transaction notifications
      shouldNotifyOnBudgetChange: true, // All members get budget notifications
      shouldNotifyOnMemberJoin: isOwner, // Only owner gets member join notifications
      shouldNotifyOnMemberLeave: isOwner // Only owner gets member leave notifications
    };
  }
}