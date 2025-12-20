import { ApiResponse } from '@/types';
import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Dashboard Summary Types
export interface DashboardSummary {
  total_balance: number;
  monthly_income: number;
  monthly_expense: number;
  budget_status: {
    total_budgets: number;
    budgets_on_track: number;
    budgets_warning: number;
    budgets_over: number;
    overall_status: 'green' | 'yellow' | 'orange' | 'red';
  };
  wallet_count: number;
  transaction_count: number;
}

// Report Types
export interface TransactionReportFilters {
  wallet_id?: string;
  category_id?: string;
  type?: 'Income' | 'Expense';
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface TransactionReport {
  transactions: any[];
  summary: {
    total_income: number;
    total_expense: number;
    net_amount: number;
    transaction_count: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CategoryBreakdownItem {
  category_id: string | null;
  category_name: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface CategoryBreakdown {
  breakdown: CategoryBreakdownItem[];
  total_amount: number;
  total_transactions: number;
}

export interface TrendDataPoint {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface TrendsReport {
  trends: TrendDataPoint[];
  period_type: 'monthly' | 'weekly';
  summary: {
    avg_income: number;
    avg_expense: number;
    avg_net: number;
    total_periods: number;
  };
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

// Export Types
export interface ExportRequest {
  format: 'csv' | 'pdf';
  wallet_id?: string;
  category_id?: string;
  type?: 'Income' | 'Expense';
  start_date?: string;
  end_date?: string;
  filename?: string;
}

// API Functions
export const dashboardApi = {
  // Get dashboard summary
  async getSummary(): Promise<DashboardSummary> {
    const token = AuthService.getToken();
    const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<DashboardSummary> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch dashboard summary');
    }

    return result.data!;
  },

  // Get transaction report
  async getTransactionReport(filters: TransactionReportFilters = {}): Promise<TransactionReport> {
    const token = AuthService.getToken();
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/dashboard/reports/transactions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<TransactionReport> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch transaction report');
    }

    return result.data!;
  },

  // Get category breakdown
  async getCategoryBreakdown(filters: {
    wallet_id?: string;
    type?: 'Income' | 'Expense';
    start_date?: string;
    end_date?: string;
  } = {}): Promise<CategoryBreakdown> {
    const token = AuthService.getToken();
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/dashboard/reports/category-breakdown?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<CategoryBreakdown> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch category breakdown');
    }

    return result.data!;
  },

  // Get trends report
  async getTrends(filters: {
    wallet_id?: string;
    period?: 'monthly' | 'weekly';
    months?: number;
  } = {}): Promise<TrendsReport> {
    const token = AuthService.getToken();
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/dashboard/reports/trends?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<TrendsReport> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch trends report');
    }

    return result.data!;
  },

  // Get chart data
  async getChartData(chartType: string, options: {
    wallet_id?: string;
    type?: 'Income' | 'Expense';
    period?: 'monthly' | 'weekly';
    months?: number;
  } = {}): Promise<ChartData> {
    const token = AuthService.getToken();
    const queryParams = new URLSearchParams();
    queryParams.append('chart_type', chartType);
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/dashboard/charts?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<ChartData> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch chart data');
    }

    return result.data!;
  },

  // Export transactions
  async exportTransactions(exportRequest: ExportRequest): Promise<Blob> {
    const token = AuthService.getToken();
    const response = await fetch(`${API_BASE_URL}/api/dashboard/export/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportRequest),
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error?.message || 'Failed to export transactions');
    }

    return response.blob();
  },

  // Export category breakdown
  async exportCategoryBreakdown(exportRequest: Omit<ExportRequest, 'format'> & { filename?: string }): Promise<Blob> {
    const token = AuthService.getToken();
    const response = await fetch(`${API_BASE_URL}/api/dashboard/export/category-breakdown`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportRequest),
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error?.message || 'Failed to export category breakdown');
    }

    return response.blob();
  },

  // Export trends
  async exportTrends(exportRequest: {
    wallet_id?: string;
    period?: 'monthly' | 'weekly';
    months?: number;
    filename?: string;
  }): Promise<Blob> {
    const token = AuthService.getToken();
    const response = await fetch(`${API_BASE_URL}/api/dashboard/export/trends`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportRequest),
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error?.message || 'Failed to export trends');
    }

    return response.blob();
  }
};