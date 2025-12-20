'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  dashboardApi, 
  DashboardSummary, 
  TransactionReport, 
  CategoryBreakdown, 
  TrendsReport,
  ChartData,
  TransactionReportFilters,
  ExportRequest
} from '@/utils/dashboardApi';

interface DashboardContextType {
  // State
  summary: DashboardSummary | null;
  transactionReport: TransactionReport | null;
  categoryBreakdown: CategoryBreakdown | null;
  trendsReport: TrendsReport | null;
  chartData: { [key: string]: ChartData };
  loading: boolean;
  error: string | null;

  // Actions
  fetchSummary: () => Promise<void>;
  fetchTransactionReport: (filters?: TransactionReportFilters) => Promise<void>;
  fetchCategoryBreakdown: (filters?: {
    wallet_id?: string;
    type?: 'Income' | 'Expense';
    start_date?: string;
    end_date?: string;
  }) => Promise<void>;
  fetchTrends: (filters?: {
    wallet_id?: string;
    period?: 'monthly' | 'weekly';
    months?: number;
  }) => Promise<void>;
  fetchChartData: (chartType: string, options?: {
    wallet_id?: string;
    type?: 'Income' | 'Expense';
    period?: 'monthly' | 'weekly';
    months?: number;
  }) => Promise<void>;
  exportTransactions: (exportRequest: ExportRequest) => Promise<void>;
  exportCategoryBreakdown: (exportRequest: Omit<ExportRequest, 'format'> & { filename?: string }) => Promise<void>;
  exportTrends: (exportRequest: {
    wallet_id?: string;
    period?: 'monthly' | 'weekly';
    months?: number;
    filename?: string;
  }) => Promise<void>;
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactionReport, setTransactionReport] = useState<TransactionReport | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown | null>(null);
  const [trendsReport, setTrendsReport] = useState<TrendsReport | null>(null);
  const [chartData, setChartData] = useState<{ [key: string]: ChartData }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactionReport = useCallback(async (filters: TransactionReportFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getTransactionReport(filters);
      setTransactionReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction report');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategoryBreakdown = useCallback(async (filters: {
    wallet_id?: string;
    type?: 'Income' | 'Expense';
    start_date?: string;
    end_date?: string;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getCategoryBreakdown(filters);
      setCategoryBreakdown(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch category breakdown');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrends = useCallback(async (filters: {
    wallet_id?: string;
    period?: 'monthly' | 'weekly';
    months?: number;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getTrends(filters);
      setTrendsReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trends report');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChartData = useCallback(async (chartType: string, options: {
    wallet_id?: string;
    type?: 'Income' | 'Expense';
    period?: 'monthly' | 'weekly';
    months?: number;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getChartData(chartType, options);
      
      // Create a unique cache key based on chart type and parameters
      const cacheKey = `${chartType}-${options.type?.toLowerCase() || 'default'}-${options.wallet_id || 'all'}`;
      
      setChartData(prev => ({ 
        ...prev, 
        [chartType]: data, // Keep original key for backward compatibility
        [cacheKey]: data   // Add unique key for specific parameters
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  }, []);

  const exportTransactions = useCallback(async (exportRequest: ExportRequest) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await dashboardApi.exportTransactions(exportRequest);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportRequest.filename || `transactions_${Date.now()}.${exportRequest.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const exportCategoryBreakdown = useCallback(async (exportRequest: Omit<ExportRequest, 'format'> & { filename?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await dashboardApi.exportCategoryBreakdown(exportRequest);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportRequest.filename || `category_breakdown_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export category breakdown');
    } finally {
      setLoading(false);
    }
  }, []);

  const exportTrends = useCallback(async (exportRequest: {
    wallet_id?: string;
    period?: 'monthly' | 'weekly';
    months?: number;
    filename?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await dashboardApi.exportTrends(exportRequest);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportRequest.filename || `trends_report_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export trends');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchSummary(),
      fetchTransactionReport(),
      fetchCategoryBreakdown(),
      fetchTrends()
    ]);
  }, [fetchSummary, fetchTransactionReport, fetchCategoryBreakdown, fetchTrends]);

  const value: DashboardContextType = {
    summary,
    transactionReport,
    categoryBreakdown,
    trendsReport,
    chartData,
    loading,
    error,
    fetchSummary,
    fetchTransactionReport,
    fetchCategoryBreakdown,
    fetchTrends,
    fetchChartData,
    exportTransactions,
    exportCategoryBreakdown,
    exportTrends,
    clearError,
    refreshAll
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};