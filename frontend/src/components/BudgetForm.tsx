'use client';

import React, { useState, useEffect } from 'react';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest, Wallet } from '@/types';
import { useBudget } from '@/contexts/BudgetContext';
import { useWallet } from '@/contexts/WalletContext';

interface BudgetFormProps {
  budget?: Budget;
  walletId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  budget,
  walletId,
  onSuccess,
  onCancel,
}) => {
  const { createBudget, updateBudget, loading } = useBudget();
  const { wallets } = useWallet();
  
  const [formData, setFormData] = useState({
    wallet_id: walletId || budget?.wallet_id || '',
    month: budget?.month || new Date().toISOString().slice(0, 7), // YYYY-MM format
    limit: budget?.limit || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (budget) {
      setFormData({
        wallet_id: budget.wallet_id,
        month: budget.month,
        limit: budget.limit,
      });
    }
  }, [budget]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.wallet_id) {
      newErrors.wallet_id = 'Please select a wallet';
    }

    if (!formData.month) {
      newErrors.month = 'Please select a month';
    }

    if (!formData.limit || formData.limit <= 0) {
      newErrors.limit = 'Budget limit must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (budget) {
        // Update existing budget
        const updateData: UpdateBudgetRequest = {
          limit: formData.limit,
        };
        const result = await updateBudget(budget.id, updateData);
        if (result) {
          onSuccess?.();
        }
      } else {
        // Create new budget
        const createData: CreateBudgetRequest = {
          wallet_id: formData.wallet_id,
          month: formData.month,
          limit: formData.limit,
        };
        const result = await createBudget(createData);
        if (result) {
          setFormData({
            wallet_id: walletId || '',
            month: new Date().toISOString().slice(0, 7),
            limit: 0,
          });
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error('Error submitting budget form:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'limit' ? parseFloat(value) || 0 : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const getWalletName = (walletId: string): string => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
        {budget ? 'Edit Budget' : 'Create New Budget'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Wallet Selection */}
        <div>
          <label htmlFor="wallet_id" className="block text-sm font-medium text-gray-700 mb-1">
            Wallet
          </label>
          {budget ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
              {getWalletName(budget.wallet_id)}
            </div>
          ) : (
            <select
              id="wallet_id"
              name="wallet_id"
              value={formData.wallet_id}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm ${
                errors.wallet_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name} {wallet.is_default && '(Default)'}
                </option>
              ))}
            </select>
          )}
          {errors.wallet_id && (
            <p className="mt-1 text-sm text-red-600">{errors.wallet_id}</p>
          )}
        </div>

        {/* Month Selection */}
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
            Month
          </label>
          {budget ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
              {new Date(budget.month + '-01').toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </div>
          ) : (
            <input
              type="month"
              id="month"
              name="month"
              value={formData.month}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm ${
                errors.month ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
          )}
          {errors.month && (
            <p className="mt-1 text-sm text-red-600">{errors.month}</p>
          )}
        </div>

        {/* Budget Limit */}
        <div>
          <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
            Budget Limit (₱)
          </label>
          <input
            type="number"
            id="limit"
            name="limit"
            value={formData.limit}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm ${
              errors.limit ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter budget limit"
            required
          />
          {errors.limit && (
            <p className="mt-1 text-sm text-red-600">{errors.limit}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 sm:py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : budget ? 'Update Budget' : 'Create Budget'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 sm:py-2 px-4 rounded-lg hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};