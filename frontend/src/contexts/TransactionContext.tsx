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
  const { user } = useAuth();

  const fetchTransactions = async (filters: TransactionFilters = {}) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response: TransactionListResponse = await TransactionService.getTransactions(filters);
      setTransactions(response.transactions);
      setTotal(response.total);
      setPage(response.page);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (filters: Omit<TransactionFilters, 'page' | 'limit'> = {}) => {
    if (!user) return;
    
    try {
      const summaryData = await TransactionService.getTransactionSummary(filters);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch transaction summary:', error);
    }
  };

  const createTransaction = async (data: CreateTransactionData): Promise<void> => {
    try {
      setLoading(true);
      const newTransaction = await TransactionService.createTransaction(data);
      setTransactions(prev => [newTransaction, ...prev]);
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
      setTransactions(prev => prev.map(transaction => 
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
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
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