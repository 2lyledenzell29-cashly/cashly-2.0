import { ApiResponse, Transaction } from '@/types';
import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateTransactionData {
  title: string;
  amount: number;
  type: 'Income' | 'Expense';
  category_id?: string;
  wallet_id?: string;
}

export interface UpdateTransactionData {
  title: string;
  amount: number;
  type: 'Income' | 'Expense';
  category_id?: string;
  wallet_id: string;
}

export interface TransactionFilters {
  wallet_id?: string;
  category_id?: string;
  type?: 'Income' | 'Expense';
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class TransactionService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = AuthService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    let result: ApiResponse<T>;
    
    try {
      result = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, create a generic error response
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }
      throw new Error('Invalid response format');
    }
    
    if (!response.ok) {
      const errorMessage = result?.error?.message || `Request failed with status ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return result;
  }

  static async getTransactions(filters: TransactionFilters = {}): Promise<TransactionListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<TransactionListResponse>(endpoint);
    return response.data || {
      transactions: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }

  static async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const response = await this.makeRequest<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.data) {
      throw new Error('Failed to create transaction');
    }
    
    return response.data;
  }

  static async updateTransaction(id: string, data: UpdateTransactionData): Promise<Transaction> {
    const response = await this.makeRequest<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.data) {
      throw new Error('Failed to update transaction');
    }
    
    return response.data;
  }

  static async deleteTransaction(id: string): Promise<void> {
    await this.makeRequest(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  static async getTransactionSummary(filters: Omit<TransactionFilters, 'page' | 'limit'> = {}): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/transactions/summary${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<{
      totalIncome: number;
      totalExpense: number;
      balance: number;
      transactionCount: number;
    }>(endpoint);
    
    return response.data || {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
    };
  }
}