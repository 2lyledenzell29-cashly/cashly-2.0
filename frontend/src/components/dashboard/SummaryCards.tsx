import React from 'react';
import { DashboardSummary } from '@/utils/dashboardApi';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'text-green-600 bg-green-100';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100';
      case 'orange':
        return 'text-orange-600 bg-orange-100';
      case 'red':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBudgetStatusText = (status: string) => {
    switch (status) {
      case 'green':
        return 'On Track';
      case 'yellow':
        return 'Watch';
      case 'orange':
        return 'Warning';
      case 'red':
        return 'Over Budget';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {/* Total Balance */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500">Total Balance</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">
              {formatCurrency(summary.total_balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Income */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500">Monthly Income</p>
            <p className="text-lg sm:text-2xl font-semibold text-green-600 truncate">
              {formatCurrency(summary.monthly_income)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Expenses */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500">Monthly Expenses</p>
            <p className="text-lg sm:text-2xl font-semibold text-red-600 truncate">
              {formatCurrency(summary.monthly_expense)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Status */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getBudgetStatusColor(summary.budget_status.overall_status)}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500">Budget Status</p>
            <p className={`text-lg sm:text-2xl font-semibold ${getBudgetStatusColor(summary.budget_status.overall_status).split(' ')[0]} truncate`}>
              {getBudgetStatusText(summary.budget_status.overall_status)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.budget_status.total_budgets} budgets tracked
            </p>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Wallets</p>
            <p className="text-xl font-semibold text-gray-900">{summary.wallet_count}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Transactions</p>
            <p className="text-xl font-semibold text-gray-900">{summary.transaction_count}</p>
          </div>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">On Track: {summary.budget_status.budgets_on_track}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Warning: {summary.budget_status.budgets_warning}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Over Budget: {summary.budget_status.budgets_over}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900 truncate">
              Net: {formatCurrency(summary.monthly_income - summary.monthly_expense)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;