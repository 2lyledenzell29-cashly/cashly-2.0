import React from 'react';
import { CategoryBreakdown } from '@/utils/dashboardApi';

interface CategoryBreakdownTableProps {
  breakdown: CategoryBreakdown;
}

const CategoryBreakdownTable: React.FC<CategoryBreakdownTableProps> = ({ breakdown }) => {
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

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Category Breakdown</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Amount:</span>
            <span className="ml-2 font-medium text-gray-900">
              {formatCurrency(breakdown.total_amount)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total Transactions:</span>
            <span className="ml-2 font-medium text-gray-900">
              {breakdown.total_transactions}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transactions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {breakdown.breakdown.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              breakdown.breakdown.map((item, index) => (
                <tr key={item.category_id || 'uncategorized'} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3`} 
                           style={{ backgroundColor: getColorForIndex(index) }}>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.category_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(item.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {item.transaction_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatPercentage(item.percentage)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(isNaN(item.percentage) ? 0 : item.percentage, 100)}%`,
                          backgroundColor: getColorForIndex(index)
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      {breakdown.breakdown.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-900">
              Average per category: {formatCurrency(breakdown.breakdown.length > 0 ? breakdown.total_amount / breakdown.breakdown.length : 0)}
            </span>
            <span className="text-gray-500">
              {breakdown.breakdown.length} categories
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to generate consistent colors for categories
const getColorForIndex = (index: number): string => {
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];
  return colors[index % colors.length];
};

export default CategoryBreakdownTable;