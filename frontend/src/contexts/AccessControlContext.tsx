import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Wallet, Category, FamilyWalletMember } from '@/types';
import { AccessControlService } from '@/utils/accessControl';

interface AccessControlContextType {
  user: User | null;
  accessibleWallets: Wallet[];
  accessibleWalletIds: string[];
  accessibleCategories: Category[];
  accessibleCategoryIds: string[];
  familyMemberships: FamilyWalletMember[];
  
  // Methods to update access control state
  setUser: (user: User | null) => void;
  setWallets: (wallets: Wallet[]) => void;
  setCategories: (categories: Category[]) => void;
  setFamilyMemberships: (memberships: FamilyWalletMember[]) => void;
  
  // Access control check methods
  canAccessWallet: (wallet: Wallet) => boolean;
  canModifyWallet: (wallet: Wallet) => boolean;
  canAccessCategory: (category: Category) => boolean;
  canModifyCategory: (category: Category) => boolean;
  canAccessTransaction: (walletId: string) => boolean;
  canAccessBudget: (walletId: string) => boolean;
  canAccessReminder: (walletId?: string) => boolean;
  isAdmin: () => boolean;
  canManageFamilyWallet: (wallet: Wallet) => boolean;
  
  // Data filtering methods
  filterAccessibleWallets: (wallets: Wallet[]) => Wallet[];
  filterAccessibleCategories: (categories: Category[]) => Category[];
  
  // Validation methods
  validateWalletAccess: (walletId: string) => boolean;
  validateCategoryAccess: (categoryId: string) => boolean;
  validateBulkWalletAccess: (walletIds: string[]) => boolean;
  validateBulkCategoryAccess: (categoryIds: string[]) => boolean;
  
  // Security methods
  logAccessViolation: (action: string, resourceType: string, resourceId: string) => void;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

interface AccessControlProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

export const AccessControlProvider: React.FC<AccessControlProviderProps> = ({
  children,
  initialUser = null
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [familyMemberships, setFamilyMemberships] = useState<FamilyWalletMember[]>([]);
  
  // Computed values
  const [accessibleWallets, setAccessibleWallets] = useState<Wallet[]>([]);
  const [accessibleWalletIds, setAccessibleWalletIds] = useState<string[]>([]);
  const [accessibleCategories, setAccessibleCategories] = useState<Category[]>([]);
  const [accessibleCategoryIds, setAccessibleCategoryIds] = useState<string[]>([]);

  // Update accessible resources when user, wallets, categories, or memberships change
  useEffect(() => {
    if (!user) {
      setAccessibleWallets([]);
      setAccessibleWalletIds([]);
      setAccessibleCategories([]);
      setAccessibleCategoryIds([]);
      return;
    }

    // Filter accessible wallets
    const filteredWallets = AccessControlService.filterAccessibleWallets(wallets, user, familyMemberships);
    setAccessibleWallets(filteredWallets);
    
    // Get accessible wallet IDs
    const walletIds = AccessControlService.getAccessibleWalletIds(wallets, user, familyMemberships);
    setAccessibleWalletIds(walletIds);
    
    // Filter accessible categories
    const filteredCategories = AccessControlService.filterAccessibleCategories(categories, user, walletIds);
    setAccessibleCategories(filteredCategories);
    setAccessibleCategoryIds(filteredCategories.map(c => c.id));
  }, [user, wallets, categories, familyMemberships]);

  // Access control check methods
  const canAccessWallet = useCallback((wallet: Wallet): boolean => {
    return user ? AccessControlService.canAccessWallet(wallet, user, familyMemberships) : false;
  }, [user, familyMemberships]);

  const canModifyWallet = useCallback((wallet: Wallet): boolean => {
    return user ? AccessControlService.canModifyWallet(wallet, user) : false;
  }, [user]);

  const canAccessCategory = useCallback((category: Category): boolean => {
    return user ? AccessControlService.canAccessCategory(category, user, accessibleWalletIds) : false;
  }, [user, accessibleWalletIds]);

  const canModifyCategory = useCallback((category: Category): boolean => {
    return user ? AccessControlService.canModifyCategory(category, user) : false;
  }, [user]);

  const canAccessTransaction = useCallback((walletId: string): boolean => {
    return accessibleWalletIds.includes(walletId);
  }, [accessibleWalletIds]);

  const canAccessBudget = useCallback((walletId: string): boolean => {
    return accessibleWalletIds.includes(walletId);
  }, [accessibleWalletIds]);

  const canAccessReminder = useCallback((walletId?: string): boolean => {
    if (!user) return false;
    if (!walletId) return true; // Personal reminder
    return accessibleWalletIds.includes(walletId);
  }, [user, accessibleWalletIds]);

  const isAdmin = useCallback((): boolean => {
    return user ? AccessControlService.isAdmin(user) : false;
  }, [user]);

  const canManageFamilyWallet = useCallback((wallet: Wallet): boolean => {
    return user ? AccessControlService.canManageFamilyWallet(wallet, user) : false;
  }, [user]);

  // Data filtering methods
  const filterAccessibleWallets = useCallback((walletsToFilter: Wallet[]): Wallet[] => {
    return user ? AccessControlService.filterAccessibleWallets(walletsToFilter, user, familyMemberships) : [];
  }, [user, familyMemberships]);

  const filterAccessibleCategories = useCallback((categoriesToFilter: Category[]): Category[] => {
    return user ? AccessControlService.filterAccessibleCategories(categoriesToFilter, user, accessibleWalletIds) : [];
  }, [user, accessibleWalletIds]);

  // Validation methods
  const validateWalletAccess = useCallback((walletId: string): boolean => {
    return accessibleWalletIds.includes(walletId);
  }, [accessibleWalletIds]);

  const validateCategoryAccess = useCallback((categoryId: string): boolean => {
    return accessibleCategoryIds.includes(categoryId);
  }, [accessibleCategoryIds]);

  const validateBulkWalletAccess = useCallback((walletIds: string[]): boolean => {
    return AccessControlService.canPerformBulkOperation(walletIds, accessibleWalletIds);
  }, [accessibleWalletIds]);

  const validateBulkCategoryAccess = useCallback((categoryIds: string[]): boolean => {
    return AccessControlService.canPerformBulkOperation(categoryIds, accessibleCategoryIds);
  }, [accessibleCategoryIds]);

  // Security methods
  const logAccessViolation = useCallback((action: string, resourceType: string, resourceId: string): void => {
    if (user) {
      AccessControlService.logAccessViolation(user, action, resourceType, resourceId);
    }
  }, [user]);

  const contextValue: AccessControlContextType = {
    user,
    accessibleWallets,
    accessibleWalletIds,
    accessibleCategories,
    accessibleCategoryIds,
    familyMemberships,
    
    setUser,
    setWallets,
    setCategories,
    setFamilyMemberships,
    
    canAccessWallet,
    canModifyWallet,
    canAccessCategory,
    canModifyCategory,
    canAccessTransaction,
    canAccessBudget,
    canAccessReminder,
    isAdmin,
    canManageFamilyWallet,
    
    filterAccessibleWallets,
    filterAccessibleCategories,
    
    validateWalletAccess,
    validateCategoryAccess,
    validateBulkWalletAccess,
    validateBulkCategoryAccess,
    
    logAccessViolation
  };

  return (
    <AccessControlContext.Provider value={contextValue}>
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = (): AccessControlContextType => {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
};

// Custom hooks for specific access control scenarios
export const useWalletAccess = () => {
  const { canAccessWallet, canModifyWallet, validateWalletAccess, accessibleWalletIds } = useAccessControl();
  
  return {
    canAccess: canAccessWallet,
    canModify: canModifyWallet,
    validate: validateWalletAccess,
    accessibleIds: accessibleWalletIds
  };
};

export const useCategoryAccess = () => {
  const { canAccessCategory, canModifyCategory, validateCategoryAccess, accessibleCategoryIds } = useAccessControl();
  
  return {
    canAccess: canAccessCategory,
    canModify: canModifyCategory,
    validate: validateCategoryAccess,
    accessibleIds: accessibleCategoryIds
  };
};

export const useTransactionAccess = () => {
  const { canAccessTransaction, validateWalletAccess, validateCategoryAccess } = useAccessControl();
  
  return {
    canAccess: canAccessTransaction,
    validateWallet: validateWalletAccess,
    validateCategory: validateCategoryAccess
  };
};

export const useAdminAccess = () => {
  const { isAdmin } = useAccessControl();
  
  return {
    isAdmin: isAdmin()
  };
};

export const useFamilyWalletAccess = () => {
  const { canManageFamilyWallet, familyMemberships } = useAccessControl();
  
  return {
    canManage: canManageFamilyWallet,
    memberships: familyMemberships
  };
};

// HOC for components that need access control
export const withAccessControlContext = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const accessControl = useAccessControl();
    
    return <Component {...props} accessControl={accessControl} />;
  };
  
  WrappedComponent.displayName = `withAccessControlContext(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};