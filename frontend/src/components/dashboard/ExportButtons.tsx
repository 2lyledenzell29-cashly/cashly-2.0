import React, { useState } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

interface ExportButtonsProps {
  reportType: 'transactions' | 'category-breakdown' | 'trends';
  filters?: any;
  disabled?: boolean;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  reportType,
  filters = {},
  disabled = false
}) => {
  const { exportTransactions, exportCategoryBreakdown, exportTrends, loading } = useDashboard();
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      
      switch (reportType) {
        case 'transactions':
          await exportTransactions({
            format: 'csv',
            ...filters,
            filename: `transactions_${timestamp}.csv`
          });
          break;
          
        case 'category-breakdown':
          await exportCategoryBreakdown({
            ...filters,
            filename: `category_breakdown_${timestamp}.csv`
          });
          break;
          
        case 'trends':
          await exportTrends({
            ...filters,
            filename: `trends_report_${timestamp}.csv`
          });
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Error handling is done in the context
    } finally {
      setExportLoading(false);
    }
  };

  const isLoading = loading || exportLoading;

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isLoading}
      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exportLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
      ) : (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      Export CSV
    </button>
  );
};

export default ExportButtons;