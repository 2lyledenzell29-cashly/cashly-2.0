import { useState, useCallback } from 'react';
import { useAccessControl } from '@/contexts/AccessControlContext';
import { ApiResponse } from '@/types';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  validateAccess?: boolean;
  resourceType?: string;
  resourceId?: string;
}

interface UseSecureApiReturn {
  loading: boolean;
  error: string | null;
  call: <T = any>(url: string, options?: ApiOptions) => Promise<T | null>;
  clearError: () => void;
}

/**
 * Custom hook for making secure API calls with access control validation
 */
export const useSecureApi = (): UseSecureApiReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, logAccessViolation } = useAccessControl();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const call = useCallback(async <T = any>(
    url: string, 
    options: ApiOptions = {}
  ): Promise<T | null> => {
    const {
      method = 'GET',
      headers = {},
      body,
      validateAccess = true,
      resourceType,
      resourceId
    } = options;

    setLoading(true);
    setError(null);

    try {
      // Validate user authentication
      if (!user) {
        throw new Error('Authentication required');
      }

      // Get JWT token from localStorage or context
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare request headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...headers
      };

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        ...(body && { body: JSON.stringify(body) })
      };

      // Make the API call
      const response = await fetch(url, requestOptions);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Log access violations for 403 errors
        if (response.status === 403 && resourceType && resourceId) {
          logAccessViolation(`API_${method}`, resourceType, resourceId);
        }
        
        throw new Error(
          errorData.error?.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Parse response
      const data: ApiResponse<T> = await response.json();

      // Handle API-level errors
      if (!data.success) {
        throw new Error(data.error?.message || 'API request failed');
      }

      return data.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('API Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, logAccessViolation]);

  return {
    loading,
    error,
    call,
    clearError
  };
};

/**
 * Hook for wallet-specific API calls with access validation
 */
export const useWalletApi = () => {
  const api = useSecureApi();
  const { validateWalletAccess, logAccessViolation, user } = useAccessControl();

  const getWallet = useCallback(async (walletId: string) => {
    if (!validateWalletAccess(walletId)) {
      logAccessViolation('GET_WALLET', 'wallet', walletId);
      throw new Error('Access denied to wallet');
    }
    
    return api.call(`/api/wallets/${walletId}`, {
      resourceType: 'wallet',
      resourceId: walletId
    });
  }, [api, validateWalletAccess, logAccessViolation]);

  const updateWallet = useCallback(async (walletId: string, data: any) => {
    if (!validateWalletAccess(walletId)) {
      logAccessViolation('UPDATE_WALLET', 'wallet', walletId);
      throw new Error('Access denied to wallet');
    }
    
    return api.call(`/api/wallets/${walletId}`, {
      method: 'PUT',
      body: data,
      resourceType: 'wallet',
      resourceId: walletId
    });
  }, [api, validateWalletAccess, logAccessViolation]);

  const deleteWallet = useCallback(async (walletId: string) => {
    if (!validateWalletAccess(walletId)) {
      logAccessViolation('DELETE_WALLET', 'wallet', walletId);
      throw new Error('Access denied to wallet');
    }
    
    return api.call(`/api/wallets/${walletId}`, {
      method: 'DELETE',
      resourceType: 'wallet',
      resourceId: walletId
    });
  }, [api, validateWalletAccess, logAccessViolation]);

  return {
    ...api,
    getWallet,
    updateWallet,
    deleteWallet
  };
};

/**
 * Hook for category-specific API calls with access validation
 */
export const useCategoryApi = () => {
  const api = useSecureApi();
  const { validateCategoryAccess, logAccessViolation } = useAccessControl();

  const getCategory = useCallback(async (categoryId: string) => {
    if (!validateCategoryAccess(categoryId)) {
      logAccessViolation('GET_CATEGORY', 'category', categoryId);
      throw new Error('Access denied to category');
    }
    
    return api.call(`/api/categories/${categoryId}`, {
      resourceType: 'category',
      resourceId: categoryId
    });
  }, [api, validateCategoryAccess, logAccessViolation]);

  const updateCategory = useCallback(async (categoryId: string, data: any) => {
    if (!validateCategoryAccess(categoryId)) {
      logAccessViolation('UPDATE_CATEGORY', 'category', categoryId);
      throw new Error('Access denied to category');
    }
    
    return api.call(`/api/categories/${categoryId}`, {
      method: 'PUT',
      body: data,
      resourceType: 'category',
      resourceId: categoryId
    });
  }, [api, validateCategoryAccess, logAccessViolation]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!validateCategoryAccess(categoryId)) {
      logAccessViolation('DELETE_CATEGORY', 'category', categoryId);
      throw new Error('Access denied to category');
    }
    
    return api.call(`/api/categories/${categoryId}`, {
      method: 'DELETE',
      resourceType: 'category',
      resourceId: categoryId
    });
  }, [api, validateCategoryAccess, logAccessViolation]);

  return {
    ...api,
    getCategory,
    updateCategory,
    deleteCategory
  };
};

/**
 * Hook for transaction-specific API calls with access validation
 */
export const useTransactionApi = () => {
  const api = useSecureApi();
  const { validateWalletAccess, validateCategoryAccess, logAccessViolation } = useAccessControl();

  const createTransaction = useCallback(async (data: {
    wallet_id: string;
    category_id?: string;
    title: string;
    amount: number;
    type: 'Income' | 'Expense';
  }) => {
    // Validate wallet access
    if (!validateWalletAccess(data.wallet_id)) {
      logAccessViolation('CREATE_TRANSACTION', 'wallet', data.wallet_id);
      throw new Error('Access denied to wallet');
    }

    // Validate category access if specified
    if (data.category_id && !validateCategoryAccess(data.category_id)) {
      logAccessViolation('CREATE_TRANSACTION', 'category', data.category_id);
      throw new Error('Access denied to category');
    }
    
    return api.call('/api/transactions', {
      method: 'POST',
      body: data
    });
  }, [api, validateWalletAccess, validateCategoryAccess, logAccessViolation]);

  const getTransactions = useCallback(async (filters: {
    wallet_id?: string;
    category_id?: string;
    start_date?: string;
    end_date?: string;
    type?: 'Income' | 'Expense';
    page?: number;
    limit?: number;
  } = {}) => {
    // Validate wallet access if specified
    if (filters.wallet_id && !validateWalletAccess(filters.wallet_id)) {
      logAccessViolation('GET_TRANSACTIONS', 'wallet', filters.wallet_id);
      throw new Error('Access denied to wallet');
    }

    // Validate category access if specified
    if (filters.category_id && !validateCategoryAccess(filters.category_id)) {
      logAccessViolation('GET_TRANSACTIONS', 'category', filters.category_id);
      throw new Error('Access denied to category');
    }

    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `/api/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.call(url);
  }, [api, validateWalletAccess, validateCategoryAccess, logAccessViolation]);

  return {
    ...api,
    createTransaction,
    getTransactions
  };
};

/**
 * Hook for budget-specific API calls with access validation
 */
export const useBudgetApi = () => {
  const api = useSecureApi();
  const { validateWalletAccess, logAccessViolation } = useAccessControl();

  const createBudget = useCallback(async (data: {
    wallet_id: string;
    month: string;
    limit: number;
  }) => {
    if (!validateWalletAccess(data.wallet_id)) {
      logAccessViolation('CREATE_BUDGET', 'wallet', data.wallet_id);
      throw new Error('Access denied to wallet');
    }
    
    return api.call('/api/budgets', {
      method: 'POST',
      body: data
    });
  }, [api, validateWalletAccess, logAccessViolation]);

  const getWalletBudgets = useCallback(async (walletId: string) => {
    if (!validateWalletAccess(walletId)) {
      logAccessViolation('GET_BUDGETS', 'wallet', walletId);
      throw new Error('Access denied to wallet');
    }
    
    return api.call(`/api/budgets/wallet/${walletId}`);
  }, [api, validateWalletAccess, logAccessViolation]);

  return {
    ...api,
    createBudget,
    getWalletBudgets
  };
};

/**
 * Hook for form validation with access control
 */
export const useFormValidation = () => {
  const { validateWalletAccess, validateCategoryAccess } = useAccessControl();

  const validateTransactionForm = useCallback((data: {
    wallet_id: string;
    category_id?: string;
  }) => {
    const errors: string[] = [];

    if (!validateWalletAccess(data.wallet_id)) {
      errors.push('Invalid wallet selection');
    }

    if (data.category_id && !validateCategoryAccess(data.category_id)) {
      errors.push('Invalid category selection');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [validateWalletAccess, validateCategoryAccess]);

  const validateBudgetForm = useCallback((data: {
    wallet_id: string;
  }) => {
    const errors: string[] = [];

    if (!validateWalletAccess(data.wallet_id)) {
      errors.push('Invalid wallet selection');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [validateWalletAccess]);

  return {
    validateTransactionForm,
    validateBudgetForm
  };
};