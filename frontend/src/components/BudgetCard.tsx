'use client';

import React, { useState, useEffect } from 'react';
import { Budget, BudgetStatus, Wallet } from '@/types';
import { useBudget } from '@/contexts/BudgetContext';
import { useWallet } from '@/contexts/WalletContext';
import { BudgetForm } from './BudgetForm';

interface BudgetCardProps {
  budget: Budget;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onDelete,
}) => {
  const { fetchBudgetStatus, getBudgetStatusById, deleteBudget } = useBudget();
  const { wallets } = useWallet();
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadBudgetStatus = async () => {
      setLoading(true);
      
      // Check if status is already cached
      const cachedStatus = getBudgetStatusById(budget.id);
      if (cachedStatus) {
        setBudgetStatus(cachedStatus);
        setLoading(false);
        return;
      }

      // Fetch status from API
      const status = await fetchBudgetStatus(budget.id);
      setBudgetStatus(status);
      setLoading(false);
    };

    loadBudgetStatus();
  }, [budget.id, fetchBudgetStatus, getBudgetStatusById]);

  const getWalletName = (): string => {
    const wallet = wallets.find(w => w.id === budget.wallet_id);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'orange':
        return 'bg-orange-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'green':
        return 'On Track';
      case 'yellow':
        return 'Approaching Limit';
      case 'orange':
        return 'Near Limit';
      case 'red':
        return 'Over Budget';
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₱0.00';
    }
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatPercentage = (percentage: number | null | undefined): string => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return '0.0';
    }
    return percentage.toFixed(1);
  };

  const formatMonth = (month: string): string => {
    return new Date(month + '-01').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const handleEdit = () => {
    setShowEditForm(true);
    onEdit?.();
  };

  const handleDelete = async () => {
    const success = await deleteBudget(budget.id);
    if (success) {
      setShowDeleteConfirm(false);
      onDelete?.();
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    // Refresh budget status
    fetchBudgetStatus(budget.id);
  };

  if (showEditForm) {
    return (
      <BudgetForm
        budget={budget}
        onSuccess={handleEditSuccess}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {formatMonth(budget.month)}
          </h3>
          <p className="text-sm text-gray-600">{getWalletName()}</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ) : budgetStatus ? (
        <>
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(budgetStatus.status)}`}
            ></div>
            <span className="text-sm font-medium text-gray-700">
              {getStatusText(budgetStatus.status)}
            </span>
          </div>

          {/* Budget Limit */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Budget Limit</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(budget.limit)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Spent</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(budgetStatus.total_spent)} ({formatPercentage(budgetStatus.percentage_used)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getStatusColor(budgetStatus.status)}`}
                style={{
                  width: `${Math.min(budgetStatus.percentage_used || 0, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Remaining Amount */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Remaining</span>
            <span className={`text-sm font-medium ${
              budgetStatus.remaining >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(budgetStatus.remaining)}
            </span>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-4">
          <p>Unable to load budget status</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Budget
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this budget for {formatMonth(budget.month)}? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};