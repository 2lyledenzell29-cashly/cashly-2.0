import { Budget, BudgetStatus, CreateBudgetRequest, UpdateBudgetRequest, ApiResponse } from '@/types';
import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  const data: ApiResponse<T> = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'An error occurred');
  }
  
  return data.data as T;
};

export const budgetApi = {
  // Get all user budgets
  getUserBudgets: async (): Promise<Budget[]> => {
    const response = await fetch(`${API_BASE_URL}/api/budgets`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Budget[]>(response);
  },

  // Get budgets for specific wallet
  getWalletBudgets: async (walletId: string): Promise<Budget[]> => {
    const response = await fetch(`${API_BASE_URL}/api/budgets/wallet/${walletId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Budget[]>(response);
  },

  // Get specific budget
  getBudgetById: async (budgetId: string): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/api/budgets/${budgetId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Budget>(response);
  },

  // Create new budget
  createBudget: async (budgetData: CreateBudgetRequest): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/api/budgets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(budgetData),
    });
    
    return handleResponse<Budget>(response);
  },

  // Update budget
  updateBudget: async (budgetId: string, budgetData: UpdateBudgetRequest): Promise<Budget> => {
    const response = await fetch(`${API_BASE_URL}/api/budgets/${budgetId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(budgetData),
    });
    
    return handleResponse<Budget>(response);
  },

  // Delete budget
  deleteBudget: async (budgetId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/budgets/${budgetId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    await handleResponse<{ message: string }>(response);
  },

  // Get budget status with calculations
  getBudgetStatus: async (budgetId: string): Promise<BudgetStatus> => {
    const response = await fetch(`${API_BASE_URL}/api/budgets/${budgetId}/status`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<BudgetStatus>(response);
  },

  // Get current month budget status for wallet
  getCurrentMonthBudgetStatus: async (walletId: string): Promise<BudgetStatus> => {
    const response = await fetch(`${API_BASE_URL}/api/budgets/wallet/${walletId}/current`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<BudgetStatus>(response);
  },
};