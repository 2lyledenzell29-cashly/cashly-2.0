'use client';

import React, { useState, useEffect } from 'react';
import { BudgetStatus as BudgetStatusType } from '@/types';
import { useBudget } from '@/contexts/BudgetContext';

interface BudgetStatusProps {
  walletId: string;
  compact?: boolean;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export const BudgetStatus: React.FC<BudgetStatusProps> = ({
  walletId,
  compact = false,
  showCreateButton = false,
  onCreateClick,
}) => {
  const { fetchCurrentMonthBudgetStatus } = useBudget();
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [noBudget, setNoBudget] = useState(false);

  useEffect(() => {
    const loadBudgetStatus = async () => {
      setLoading(true);
      setNoBudget(false);
      
      try {
        const status = await fetchCurrentMonthBudgetStatus(walletId);
        if (status) {
          setBudgetStatus(status);
        } else {
          setNoBudget(true);
        }
      } catch (error) {
        setNoBudget(true);
      } finally {
        setLoading(false);
      }
    };

    loadBudgetStatus();
  }, [walletId, fetchCurrentMonthBudgetStatus]);

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

  const getStatusTextColor = (status: string): string => {
    switch (status) {
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'orange':
        return 'text-orange-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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

  const safePercentage = (percentage: number | null | undefined): number => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return 0;
    }
    return percentage;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${compact ? 'space-y-2' : 'space-y-3'}`}>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-2 bg-gray-200 rounded"></div>
        {!compact && <div className="h-4 bg-gray-200 rounded"></div>}
      </div>
    );
  }

  if (noBudget) {
    return (
      <div className={`text-center ${compact ? 'py-2' : 'py-4'}`}>
        <p className="text-sm text-gray-500 mb-2">No budget set for this month</p>
        {showCreateButton && (
          <button
            onClick={onCreateClick}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Create Budget
          </button>
        )}
      </div>
    );
  }

  if (!budgetStatus) {
    return (
      <div className="text-center text-gray-500 py-2">
        <p className="text-sm">Unable to load budget status</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Status indicator and percentage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(budgetStatus.status)}`}
            ></div>
            <span className="text-xs font-medium text-gray-700">
              {formatPercentage(budgetStatus.percentage_used)}% used
            </span>
          </div>
          <span className="text-xs text-gray-600">
            {formatCurrency(budgetStatus.total_spent)} / {formatCurrency(budgetStatus.budget.limit)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${getStatusColor(budgetStatus.status)}`}
            style={{
              width: `${Math.min(safePercentage(budgetStatus.percentage_used), 100)}%`,
            }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor(budgetStatus.status)}`}
          ></div>
          <span className={`text-sm font-medium ${getStatusTextColor(budgetStatus.status)}`}>
            {getStatusText(budgetStatus.status)}
          </span>
        </div>
        <span className="text-sm text-gray-600">
          {formatPercentage(budgetStatus.percentage_used)}%
        </span>
      </div>

      {/* Budget amounts */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Spent</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(budgetStatus.total_spent)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Budget</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(budgetStatus.budget.limit)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className={`font-medium ${
            budgetStatus.remaining >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(budgetStatus.remaining)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${getStatusColor(budgetStatus.status)}`}
          style={{
            width: `${Math.min(safePercentage(budgetStatus.percentage_used), 100)}%`,
          }}
        ></div>
      </div>
    </div>
  );
};