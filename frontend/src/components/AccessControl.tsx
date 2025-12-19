import React from 'react';
import { User, Wallet, Category, Transaction, Budget, Reminder, FamilyWalletMember } from '@/types';
import { AccessControlService } from '@/utils/accessControl';

interface BaseAccessControlProps {
  user: User | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onAccessDenied?: () => void;
}

interface WalletAccessControlProps extends BaseAccessControlProps {
  wallet: Wallet;
  familyMemberships?: FamilyWalletMember[];
  requireModifyAccess?: boolean;
}

interface CategoryAccessControlProps extends BaseAccessControlProps {
  category: Category;
  accessibleWalletIds?: string[];
  requireModifyAccess?: boolean;
}

interface TransactionAccessControlProps extends BaseAccessControlProps {
  transaction: Transaction;
  accessibleWalletIds?: string[];
  requireModifyAccess?: boolean;
}

interface BudgetAccessControlProps extends BaseAccessControlProps {
  budget: Budget;
  accessibleWalletIds?: string[];
}

interface ReminderAccessControlProps extends BaseAccessControlProps {
  reminder: Reminder;
  accessibleWalletIds?: string[];
  requireModifyAccess?: boolean;
}

interface AdminAccessControlProps extends BaseAccessControlProps {
  // No additional props needed
}

interface FamilyWalletManagementProps extends BaseAccessControlProps {
  wallet: Wallet;
}

/**
 * Generic access control wrapper component
 */
const AccessControlWrapper: React.FC<{
  hasAccess: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onAccessDenied?: () => void;
}> = ({ hasAccess, children, fallback = null, onAccessDenied }) => {
  React.useEffect(() => {
    if (!hasAccess && onAccessDenied) {
      onAccessDenied();
    }
  }, [hasAccess, onAccessDenied]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Wallet access control component
 */
export const WalletAccessControl: React.FC<WalletAccessControlProps> = ({
  user,
  wallet,
  familyMemberships,
  requireModifyAccess = false,
  children,
  fallback,
  onAccessDenied
}) => {
  const hasAccess = user && wallet && (
    requireModifyAccess 
      ? AccessControlService.canModifyWallet(wallet, user)
      : AccessControlService.canAccessWallet(wallet, user, familyMemberships)
  );

  return (
    <AccessControlWrapper
      hasAccess={!!hasAccess}
      fallback={fallback}
      onAccessDenied={onAccessDenied}
    >
      {children}
    </AccessControlWrapper>
  );
};

/**
 * Category access control component
 */
export const CategoryAccessControl: React.FC<CategoryAccessControlProps> = ({
  user,
  category,
  accessibleWalletIds,
  requireModifyAccess = false,
  children,
  fallback,
  onAccessDenied
}) => {
  const hasAccess = user && category && (
    requireModifyAccess 
      ? AccessControlService.canModifyCategory(category, user)
      : AccessControlService.canAccessCategory(category, user, accessibleWalletIds)
  );

  return (
    <AccessControlWrapper
      hasAccess={!!hasAccess}
      fallback={fallback}
      onAccessDenied={onAccessDenied}
    >
      {children}
    </AccessControlWrapper>
  );
};

/**
 * Transaction access control component
 */
export const TransactionAccessControl: React.FC<TransactionAccessControlProps> = ({
  user,
  transaction,
  accessibleWalletIds,
  requireModifyAccess = false,
  children,
  fallback,
  onAccessDenied
}) => {
  const hasAccess = user && transaction && (
    requireModifyAccess 
      ? AccessControlService.canModifyTransaction(transaction, user, accessibleWalletIds)
      : AccessControlService.canAccessTransaction(transaction, user, accessibleWalletIds)
  );

  return (
    <AccessControlWrapper
      hasAccess={!!hasAccess}
      fallback={fallback}
      onAccessDenied={onAccessDenied}
    >
      {children}
    </AccessControlWrapper>
  );
};

/**
 * Budget access control component
 */
export const BudgetAccessControl: React.FC<BudgetAccessControlProps> = ({
  user,
  budget,
  accessibleWalletIds,
  children,
  fallback,
  onAccessDenied
}) => {
  const hasAccess = user && budget && AccessControlService.canAccessBudget(budget, user, accessibleWalletIds);

  return (
    <AccessControlWrapper
      hasAccess={!!hasAccess}
      fallback={fallback}
      onAccessDenied={onAccessDenied}
    >
      {children}
    </AccessControlWrapper>
  );
};

/**
 * Reminder access control component
 */
export const ReminderAccessControl: React.FC<ReminderAccessControlProps> = ({
  user,
  reminder,
  accessibleWalletIds,
  requireModifyAccess = false,
  children,
  fallback,
  onAccessDenied
}) => {
  const hasAccess = user && reminder && (
    requireModifyAccess 
      ? AccessControlService.canModifyReminder(reminder, user)
      : AccessControlService.canAccessReminder(reminder, user, accessibleWalletIds)
  );

  return (
    <AccessControlWrapper
      hasAccess={!!hasAccess}
      fallback={fallback}
      onAccessDenied={onAccessDenied}
    >
      {children}
    </AccessControlWrapper>
  );
};

/**
 * Admin access control component
 */
export const AdminAccessControl: React.FC<AdminAccessControlProps> = ({
  user,
  children,
  fallback,
  onAccessDenied
}) => {
  const hasAccess = user && AccessControlService.isAdmin(user);

  return (
    <AccessControlWrapper
      hasAccess={!!hasAccess}
      fallback={fallback}
      onAccessDenied={onAccessDenied}
    >
      {children}
    </AccessControlWrapper>
  );
};

/**
 * Family wallet management access control component
 */
export const FamilyWalletManagementControl: React.FC<FamilyWalletManagementProps> = ({
  user,
  wallet,
  children,
  fallback,
  onAccessDenied
}) => {
  const hasAccess = user && wallet && AccessControlService.canManageFamilyWallet(wallet, user);

  return (
    <AccessControlWrapper
      hasAccess={!!hasAccess}
      fallback={fallback}
      onAccessDenied={onAccessDenied}
    >
      {children}
    </AccessControlWrapper>
  );
};

/**
 * Higher-order component for protecting entire pages
 */
export const withAccessControl = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  accessCheck: (user: User | null) => boolean,
  fallbackComponent?: React.ComponentType
) => {
  const AccessControlledComponent: React.FC<P & { user?: User | null }> = (props) => {
    const { user, ...restProps } = props;
    const hasAccess = accessCheck(user || null);

    if (!hasAccess) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent />;
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...(restProps as P)} />;
  };

  AccessControlledComponent.displayName = `withAccessControl(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AccessControlledComponent;
};

/**
 * Hook for conditional rendering based on access control
 */
export const useConditionalRender = (user: User | null) => {
  return {
    renderIfCanAccessWallet: (wallet: Wallet, familyMemberships?: FamilyWalletMember[]) => (content: React.ReactNode) =>
      user && AccessControlService.canAccessWallet(wallet, user, familyMemberships) ? content : null,
    
    renderIfCanModifyWallet: (wallet: Wallet) => (content: React.ReactNode) =>
      user && AccessControlService.canModifyWallet(wallet, user) ? content : null,
    
    renderIfCanAccessCategory: (category: Category, accessibleWalletIds?: string[]) => (content: React.ReactNode) =>
      user && AccessControlService.canAccessCategory(category, user, accessibleWalletIds) ? content : null,
    
    renderIfCanModifyCategory: (category: Category) => (content: React.ReactNode) =>
      user && AccessControlService.canModifyCategory(category, user) ? content : null,
    
    renderIfCanAccessTransaction: (transaction: Transaction, accessibleWalletIds?: string[]) => (content: React.ReactNode) =>
      user && AccessControlService.canAccessTransaction(transaction, user, accessibleWalletIds) ? content : null,
    
    renderIfCanModifyTransaction: (transaction: Transaction, accessibleWalletIds?: string[]) => (content: React.ReactNode) =>
      user && AccessControlService.canModifyTransaction(transaction, user, accessibleWalletIds) ? content : null,
    
    renderIfAdmin: () => (content: React.ReactNode) =>
      user && AccessControlService.isAdmin(user) ? content : null,
    
    renderIfCanManageFamilyWallet: (wallet: Wallet) => (content: React.ReactNode) =>
      user && AccessControlService.canManageFamilyWallet(wallet, user) ? content : null
  };
};

/**
 * Error boundary for access control violations
 */
interface AccessControlErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AccessControlErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  AccessControlErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AccessControlErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Access Control Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Security Error</h1>
            <p className="text-gray-600">An access control error occurred. Please refresh the page.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}