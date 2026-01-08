import React from 'react';
import { TransactionReport } from '@/utils/dashboardApi';
import { useCategory } from '@/contexts/CategoryContext';

interface TransactionReportTableProps {
  report: TransactionReport;
  onPageChange: (page: number) => void;
}

const TransactionReportTable: React.FC<TransactionReportTableProps> = ({
  report,
  onPageChange
}) => {
  const { categories = [] } = useCategory();

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    return type === 'Income' ? 'text-green-600' : 'text-red-600';
  };

  const generatePageNumbers = () => {
    const { page, total_pages } = report.pagination;
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(total_pages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Summary */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Transaction Report</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
          <div>
            <span className="text-gray-500 block mb-1">Total Income:</span>
            <span className="font-medium text-green-600 text-base">
              {formatCurrency(report.summary.total_income)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Total Expense:</span>
            <span className="font-medium text-red-600 text-base">
              {formatCurrency(report.summary.total_expense)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Net Amount:</span>
            <span className={`font-medium text-base ${report.summary.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(report.summary.net_amount)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Total Transactions:</span>
            <span className="font-medium text-gray-900 text-base">
              {report.summary.transaction_count}
            </span>
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {report.transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              report.transactions.map((transaction: any) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCategoryName(transaction.category_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {report.transactions.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No transactions found
          </div>
        ) : (
          report.transactions.map((transaction: any) => (
            <div key={transaction.id} className="px-4 py-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
                <span className={`ml-2 text-base font-medium ${getTypeColor(transaction.type)} whitespace-nowrap`}>
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {transaction.type}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                  {getCategoryName(transaction.category_id)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {report.pagination.total_pages > 1 && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-500 text-center sm:text-left">
              Showing {((report.pagination.page - 1) * report.pagination.limit) + 1} to{' '}
              {Math.min(report.pagination.page * report.pagination.limit, report.pagination.total)} of{' '}
              {report.pagination.total} results
            </div>
            <div className="flex justify-center space-x-1">
              <button
                onClick={() => onPageChange(report.pagination.page - 1)}
                disabled={report.pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="hidden sm:flex space-x-1">
                {generatePageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${pageNum === report.pagination.page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <div className="sm:hidden px-3 py-1 text-sm">
                {report.pagination.page} / {report.pagination.total_pages}
              </div>
              <button
                onClick={() => onPageChange(report.pagination.page + 1)}
                disabled={report.pagination.page === report.pagination.total_pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionReportTable;