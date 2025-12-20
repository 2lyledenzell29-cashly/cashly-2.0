'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Budget, BudgetStatus, CreateBudgetRequest, UpdateBudgetRequest } from '@/types';
import { budgetApi } from '@/utils/budgetApi';
import toast from 'react-hot-toast';

interface BudgetContextType {
  budgets: Budget[];
  budgetStatuses: Record<string, BudgetStatus>;
  loading: boolean;
  error: string | null;
  
  // Budget operations
  fetchUserBudgets: () => Promise<void>;
  fetchWalletBudgets: (walletId: string) => Promise<Budget[]>;
  fetchBudgetStatus: (budgetId: string) => Promise<BudgetStatus | null>;
  fetchCurrentMonthBudgetStatus: (walletId: string) => Promise<BudgetStatus | null>;
  createBudget: (budgetData: CreateBudgetRequest) => Promise<Budget | null>;
  updateBudget: (budgetId: string, budgetData: UpdateBudgetRequest) => Promise<Budget | null>;
  deleteBudget: (budgetId: string) => Promise<boolean>;
  
  // Utility functions
  clearError: () => void;
  getBudgetById: (budgetId: string) => Budget | undefined;
  getBudgetStatusById: (budgetId: string) => BudgetStatus | undefined;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};

interface BudgetProviderProps {
  children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetStatuses, setBudgetStatuses] = useState<Record<string, BudgetStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchUserBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userBudgets = await budgetApi.getUserBudgets();
      setBudgets(userBudgets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch budgets';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWalletBudgets = useCallback(async (walletId: string): Promise<Budget[]> => {
    try {
      setError(null);
      const walletBudgets = await budgetApi.getWalletBudgets(walletId);
      
      // Update budgets state with wallet budgets
      setBudgets(prevBudgets => {
        const otherBudgets = prevBudgets.filter(b => b.wallet_id !== walletId);
        return [...otherBudgets, ...walletBudgets];
      });
      
      return walletBudgets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet budgets';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, []);

  const fetchBudgetStatus = useCallback(async (budgetId: string): Promise<BudgetStatus | null> => {
    try {
      setError(null);
      const status = await budgetApi.getBudgetStatus(budgetId);
      
      // Update budget statuses
      setBudgetStatuses(prev => ({
        ...prev,
        [budgetId]: status
      }));
      
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch budget status';
      setError(errorMessage);
      return null;
    }
  }, []);

  const fetchCurrentMonthBudgetStatus = useCallback(async (walletId: string): Promise<BudgetStatus | null> => {
    try {
      setError(null);
      const status = await budgetApi.getCurrentMonthBudgetStatus(walletId);
      
      // Update budget statuses
      setBudgetStatuses(prev => ({
        ...prev,
        [status.budget.id]: status
      }));
      
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch current month budget status';
      setError(errorMessage);
      return null;
    }
  }, []);

  const createBudget = useCallback(async (budgetData: CreateBudgetRequest): Promise<Budget | null> => {
    try {
      setLoading(true);
      setError(null);
      const newBudget = await budgetApi.createBudget(budgetData);
      
      setBudgets(prev => [...prev, newBudget]);
      toast.success('Budget created successfully');
      return newBudget;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create budget';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBudget = useCallback(async (budgetId: string, budgetData: UpdateBudgetRequest): Promise<Budget | null> => {
    try {
      setLoading(true);
      setError(null);
      const updatedBudget = await budgetApi.updateBudget(budgetId, budgetData);
      
      setBudgets(prev => prev.map(budget => 
        budget.id === budgetId ? updatedBudget : budget
      ));
      
      // Clear cached status to force refresh
      setBudgetStatuses(prev => {
        const { [budgetId]: removed, ...rest } = prev;
        return rest;
      });
      
      toast.success('Budget updated successfully');
      return updatedBudget;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update budget';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBudget = useCallback(async (budgetId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await budgetApi.deleteBudget(budgetId);
      
      setBudgets(prev => prev.filter(budget => budget.id !== budgetId));
      
      // Remove cached status
      setBudgetStatuses(prev => {
        const { [budgetId]: removed, ...rest } = prev;
        return rest;
      });
      
      toast.success('Budget deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete budget';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBudgetById = useCallback((budgetId: string): Budget | undefined => {
    return budgets.find(budget => budget.id === budgetId);
  }, [budgets]);

  const getBudgetStatusById = useCallback((budgetId: string): BudgetStatus | undefined => {
    return budgetStatuses[budgetId];
  }, [budgetStatuses]);

  const value: BudgetContextType = {
    budgets,
    budgetStatuses,
    loading,
    error,
    fetchUserBudgets,
    fetchWalletBudgets,
    fetchBudgetStatus,
    fetchCurrentMonthBudgetStatus,
    createBudget,
    updateBudget,
    deleteBudget,
    clearError,
    getBudgetById,
    getBudgetStatusById,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};