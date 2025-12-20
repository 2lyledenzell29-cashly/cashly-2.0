'use client';

import React, { createContext, useContext, useState } from 'react';
import { Transaction } from '@/types';
import { 
  TransactionService, 
  CreateTransactionData, 
  UpdateTransactionData, 
  TransactionFilters,
  TransactionListResponse 
} from '@/utils/transactionApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface TransactionContextType {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  };
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<void>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchSummary: (filters?: Omit<TransactionFilters, 'page' | 'limit'>) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
};

interface TransactionProviderProps {
  children: React.ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  });
  const [initialized, setInitialized] = useState(false);
  const { user } = useAuth();

  // Initialize data when user becomes available
  React.useEffect(() => {
    if (user && !initialized) {
      console.log('TransactionContext: Initializing data for user:', user.id);
      const defaultFilters = { page: 1, limit: 10 };
      fetchTransactions(defaultFilters);
      fetchSummary({}); // Summary doesn't need page/limit
      setInitialized(true);
    } else if (!user && initialized) {
      // Reset state when user logs out
      console.log('TransactionContext: Resetting data - user logged out');
      setTransactions([]);
      setTotal(0);
      setPage(1);
      setTotalPages(0);
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
      });
      setInitialized(false);
    }
  }, [user, initialized]);

  const fetchTransactions = async (filters: TransactionFilters = {}) => {
    if (!user) {
      console.log('fetchTransactions: No user, skipping');
      return;
    }
    
    console.log('fetchTransactions: Starting with filters:', filters);
    try {
      setLoading(true);
      const response: TransactionListResponse = await TransactionService.getTransactions(filters);
      console.log('fetchTransactions: Response received:', response);
      setTransactions(response.transactions || []);
      setTotal(response.total || 0);
      setPage(response.page || 1);
      setTotalPages(response.totalPages || 0);
      console.log('fetchTransactions: State updated, transactions count:', response.transactions?.length || 0);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
      // Reset to empty array on error
      setTransactions([]);
      setTotal(0);
      setPage(1);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (filters: Omit<TransactionFilters, 'page' | 'limit'> = {}) => {
    if (!user) {
      console.log('fetchSummary: No user, skipping');
      return;
    }
    
    console.log('fetchSummary: Starting with filters:', filters);
    try {
      const summaryData = await TransactionService.getTransactionSummary(filters);
      console.log('fetchSummary: Response received:', summaryData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch transaction summary:', error);
    }
  };

  const createTransaction = async (data: CreateTransactionData): Promise<void> => {
    try {
      setLoading(true);
      const newTransaction = await TransactionService.createTransaction(data);
      setTransactions(prev => [newTransaction, ...(prev || [])]);
      setTotal(prev => prev + 1);
      toast.success('Transaction created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create transaction';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id: string, data: UpdateTransactionData): Promise<void> => {
    try {
      setLoading(true);
      const updatedTransaction = await TransactionService.updateTransaction(id, data);
      setTransactions(prev => (prev || []).map(transaction => 
        transaction.id === id ? updatedTransaction : transaction
      ));
      toast.success('Transaction updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update transaction';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await TransactionService.deleteTransaction(id);
      setTransactions(prev => (prev || []).filter(transaction => transaction.id !== id));
      setTotal(prev => prev - 1);
      toast.success('Transaction deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete transaction';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: TransactionContextType = {
    transactions,
    total,
    page,
    totalPages,
    loading,
    summary,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchSummary,
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};