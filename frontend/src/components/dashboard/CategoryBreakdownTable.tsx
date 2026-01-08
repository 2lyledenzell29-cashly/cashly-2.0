import React from 'react';
import { CategoryBreakdown } from '@/utils/dashboardApi';

interface CategoryBreakdownTableProps {
  breakdown: CategoryBreakdown;
  showTypeIndicators?: boolean;
}

const CategoryBreakdownTable: React.FC<CategoryBreakdownTableProps> = ({ breakdown, showTypeIndicators = false }) => {
  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) {
      return '₱0.00';
    }
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    if (isNaN(percentage) || !isFinite(percentage)) {
      return '0.0%';
    }
    return `${percentage.toFixed(1)}%`;
  };

  const renderTypeIndicators = (transactionTypes?: ('Income' | 'Expense')[]) => {
    if (!showTypeIndicators || !transactionTypes || transactionTypes.length === 0) {
      return null;
    }

    return (
      <div className="flex gap-1 mt-1 flex-wrap">
        {transactionTypes.includes('Income') && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Income
          </span>
        )}
        {transactionTypes.includes('Expense') && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Expense
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Category Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Total Amount</div>
            <div className="text-lg sm:text-xl font-bold text-blue-900">
              {formatCurrency(breakdown.total_amount)}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xs sm:text-sm text-purple-600 font-medium mb-1">Total Transactions</div>
            <div className="text-lg sm:text-xl font-bold text-purple-900">
              {breakdown.total_transactions}
            </div>
          </div>
        </div>
      </div>

      {breakdown.breakdown.length === 0 ? (
        <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm sm:text-base">No category data available</p>
        </div>
      ) : (
        <>
          {/* Unified Card View for All Screen Sizes */}
          <div className="divide-y divide-gray-100">
            {breakdown.breakdown.map((item, index) => (
              <div key={item.category_id || 'uncategorized'} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center min-w-0 flex-1 mr-4">
                    <div 
                      className="w-5 h-5 rounded-full mr-4 flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: getColorForIndex(index) }}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {item.category_name}
                      </h4>
                      {renderTypeIndicators(item.transaction_types)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(item.total_amount)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatPercentage(item.percentage)} of total
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-medium mb-1">Transactions</div>
                    <div className="text-lg font-bold text-gray-900">
                      {item.transaction_count}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-medium mb-1">Average per Transaction</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(item.transaction_count > 0 ? item.total_amount / item.transaction_count : 0)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Progress</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatPercentage(item.percentage)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                      style={{
                        width: `${Math.min(isNaN(item.percentage) ? 0 : item.percentage, 100)}%`,
                        backgroundColor: getColorForIndex(index)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Summary Footer */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Average per Category</div>
                  <div className="text-sm font-bold text-blue-600">
                    {formatCurrency(breakdown.breakdown.length > 0 ? breakdown.total_amount / breakdown.breakdown.length : 0)}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Total Categories</div>
                  <div className="text-sm font-bold text-purple-600">
                    {breakdown.breakdown.length}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Avg Transactions</div>
                  <div className="text-sm font-bold text-green-600">
                    {Math.round(breakdown.total_transactions / breakdown.breakdown.length || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Enhanced color palette with better contrast and modern colors
const getColorForIndex = (index: number): string => {
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red  
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#14B8A6', // Teal
    '#F43F5E', // Rose
  ];
  return colors[index % colors.length];
};

export default CategoryBreakdownTable;