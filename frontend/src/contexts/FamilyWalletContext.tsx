import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Wallet, FamilyWalletMember, Invitation } from '@/types';
import * as familyWalletApi from '@/utils/familyWalletApi';
import { useAuth } from './AuthContext';

interface FamilyWalletContextType {
  // State
  familyWallets: Wallet[];
  pendingInvitations: Invitation[];
  loading: boolean;
  error: string | null;

  // Actions
  createFamilyWallet: (name: string) => Promise<void>;
  getFamilyWalletMembers: (walletId: string) => Promise<FamilyWalletMember[]>;
  inviteToFamilyWallet: (walletId: string, email: string) => Promise<void>;
  getFamilyWalletInvitations: (walletId: string) => Promise<Invitation[]>;
  removeFamilyWalletMember: (walletId: string, memberId: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  refreshFamilyWallets: () => Promise<void>;
  refreshPendingInvitations: () => Promise<void>;
  clearError: () => void;
}

const FamilyWalletContext = createContext<FamilyWalletContextType | undefined>(undefined);

interface FamilyWalletProviderProps {
  children: ReactNode;
}

export const FamilyWalletProvider: React.FC<FamilyWalletProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [familyWallets, setFamilyWallets] = useState<Wallet[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load family wallets when user changes
  useEffect(() => {
    if (user) {
      refreshFamilyWallets();
      refreshPendingInvitations();
    } else {
      setFamilyWallets([]);
      setPendingInvitations([]);
    }
  }, [user]);

  const handleError = (error: any) => {
    console.error('Family Wallet Error:', error);
    setError(error.message || 'An unexpected error occurred');
  };

  const clearError = () => {
    setError(null);
  };

  const refreshFamilyWallets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const wallets = await familyWalletApi.getUserFamilyWallets();
      setFamilyWallets(wallets);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPendingInvitations = async () => {
    if (!user) return;

    try {
      setError(null);
      const invitations = await familyWalletApi.getUserPendingInvitations();
      setPendingInvitations(invitations);
    } catch (error) {
      handleError(error);
    }
  };

  const createFamilyWallet = async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      const newWallet = await familyWalletApi.createFamilyWallet({ name });
      setFamilyWallets(prev => [...prev, newWallet]);
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getFamilyWalletMembers = async (walletId: string): Promise<FamilyWalletMember[]> => {
    try {
      setError(null);
      return await familyWalletApi.getFamilyWalletMembers(walletId);
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  const inviteToFamilyWallet = async (walletId: string, email: string) => {
    try {
      setError(null);
      await familyWalletApi.inviteToFamilyWallet(walletId, { inviteeEmail: email });
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  const getFamilyWalletInvitations = async (walletId: string): Promise<Invitation[]> => {
    try {
      setError(null);
      return await familyWalletApi.getFamilyWalletInvitations(walletId);
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  const removeFamilyWalletMember = async (walletId: string, memberId: string) => {
    try {
      setError(null);
      await familyWalletApi.removeFamilyWalletMember(walletId, memberId);
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await familyWalletApi.acceptInvitation(invitationId);
      
      // Refresh both family wallets and pending invitations
      await Promise.all([
        refreshFamilyWallets(),
        refreshPendingInvitations()
      ]);
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      setError(null);
      await familyWalletApi.declineInvitation(invitationId);
      
      // Refresh pending invitations
      await refreshPendingInvitations();
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  const value: FamilyWalletContextType = {
    // State
    familyWallets,
    pendingInvitations,
    loading,
    error,

    // Actions
    createFamilyWallet,
    getFamilyWalletMembers,
    inviteToFamilyWallet,
    getFamilyWalletInvitations,
    removeFamilyWalletMember,
    acceptInvitation,
    declineInvitation,
    refreshFamilyWallets,
    refreshPendingInvitations,
    clearError,
  };

  return (
    <FamilyWalletContext.Provider value={value}>
      {children}
    </FamilyWalletContext.Provider>
  );
};

export const useFamilyWallet = (): FamilyWalletContextType => {
  const context = useContext(FamilyWalletContext);
  if (context === undefined) {
    throw new Error('useFamilyWallet must be used within a FamilyWalletProvider');
  }
  return context;
};