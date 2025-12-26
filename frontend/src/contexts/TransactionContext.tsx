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
import { requestManager } from '@/utils/requestManager';
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
  fetchSummary: (filters?: Omit<TransactionFilters, 'page' | 'limit'>) => Promise<void>;
  fetchTransactionsAndSummary: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<void>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
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
      // We'll let the transactions page handle the initial load with default wallet
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
    
    const requestKey = `transactions-${JSON.stringify(filters)}`;
    
    return requestManager.debouncedRequest(requestKey, async () => {
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
    }, 300);
  };

  const fetchSummary = async (filters: Omit<TransactionFilters, 'page' | 'limit'> = {}) => {
    if (!user) {
      console.log('fetchSummary: No user, skipping');
      return;
    }
    
    console.log('fetchSummary: Starting with filters:', filters);
    
    const requestKey = `summary-${JSON.stringify(filters)}`;
    
    return requestManager.debouncedRequest(requestKey, async () => {
      try {
        const summaryData = await TransactionService.getTransactionSummary(filters);
        console.log('fetchSummary: Response received:', summaryData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Failed to fetch transaction summary:', error);
      }
    }, 300);
  };

  // Combined function to fetch both transactions and summary efficiently
  const fetchTransactionsAndSummary = async (filters: TransactionFilters = {}) => {
    if (!user) {
      console.log('fetchTransactionsAndSummary: No user, skipping');
      return;
    }
    
    console.log('fetchTransactionsAndSummary: Starting with filters:', filters);
    
    const requestKey = `transactions-and-summary-${JSON.stringify(filters)}`;
    
    return requestManager.debouncedRequest(requestKey, async () => {
      try {
        setLoading(true);
        
        // Prepare summary filters (exclude page and limit)
        const { page: _, limit: __, ...summaryFilters } = filters;
        
        // Make both requests in parallel
        const [transactionsResponse, summaryData] = await Promise.all([
          TransactionService.getTransactions(filters),
          TransactionService.getTransactionSummary(summaryFilters)
        ]);
        
        console.log('fetchTransactionsAndSummary: Both responses received');
        
        // Update transactions state
        setTransactions(transactionsResponse.transactions || []);
        setTotal(transactionsResponse.total || 0);
        setPage(transactionsResponse.page || 1);
        setTotalPages(transactionsResponse.totalPages || 0);
        
        // Update summary state
        setSummary(summaryData);
        
        console.log('fetchTransactionsAndSummary: State updated, transactions count:', transactionsResponse.transactions?.length || 0);
      } catch (error) {
        console.error('Failed to fetch transactions and summary:', error);
        toast.error('Failed to load data');
        // Reset to empty array on error
        setTransactions([]);
        setTotal(0);
        setPage(1);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    }, 300);
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
    fetchSummary,
    fetchTransactionsAndSummary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};