'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Wallet } from '@/types';
import { WalletService } from '@/utils/walletApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WalletContextType {
  wallets: Wallet[];
  defaultWallet: Wallet | null;
  loading: boolean;
  createWallet: (name: string) => Promise<void>;
  updateWallet: (id: string, name: string) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  setDefaultWallet: (id: string) => Promise<void>;
  refreshWallets: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const defaultWallet = wallets.find(wallet => wallet.is_default) || null;

  const refreshWallets = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedWallets = await WalletService.getWallets();
      setWallets(fetchedWallets);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshWallets();
    } else {
      setWallets([]);
    }
  }, [user]);

  const createWallet = async (name: string): Promise<void> => {
    try {
      setLoading(true);
      const newWallet = await WalletService.createWallet({ name });
      setWallets(prev => [...prev, newWallet]);
      toast.success('Wallet created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create wallet';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateWallet = async (id: string, name: string): Promise<void> => {
    try {
      setLoading(true);
      const updatedWallet = await WalletService.updateWallet(id, { name });
      setWallets(prev => prev.map(wallet => 
        wallet.id === id ? updatedWallet : wallet
      ));
      toast.success('Wallet updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update wallet';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteWallet = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await WalletService.deleteWallet(id);
      setWallets(prev => prev.filter(wallet => wallet.id !== id));
      toast.success('Wallet deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete wallet';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setDefaultWallet = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      const updatedWallet = await WalletService.setDefaultWallet(id);
      setWallets(prev => prev.map(wallet => ({
        ...wallet,
        is_default: wallet.id === id
      })));
      toast.success('Default wallet updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set default wallet';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: WalletContextType = {
    wallets,
    defaultWallet,
    loading,
    createWallet,
    updateWallet,
    deleteWallet,
    setDefaultWallet,
    refreshWallets,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};