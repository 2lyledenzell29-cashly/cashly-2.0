import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import SummaryCards from '@/components/dashboard/SummaryCards';
import ReportFilters from '@/components/dashboard/ReportFilters';
import TransactionReportTable from '@/components/dashboard/TransactionReportTable';
import CategoryBreakdownTable from '@/components/dashboard/CategoryBreakdownTable';
import ExportButtons from '@/components/dashboard/ExportButtons';
import UpcomingReminders from '@/components/dashboard/UpcomingReminders';
import SpendingTrendsChart from '@/components/charts/SpendingTrendsChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import IncomeExpenseBarChart from '@/components/charts/IncomeExpenseBarChart';
import BudgetProgressChart from '@/components/charts/BudgetProgressChart';

const DashboardContent: React.FC = () => {
  const {
    summary,
    transactionReport,
    categoryBreakdown,
    trendsReport,
    loading,
    error,
    fetchSummary,
    fetchTransactionReport,
    fetchCategoryBreakdown,
    fetchTrends,
    clearError
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'categories' | 'trends'>('overview');
  const [reportFilters, setReportFilters] = useState<any>({});

  useEffect(() => {
    // Load initial data
    fetchSummary();
    fetchTransactionReport({ page: 1, limit: 10 });
    fetchCategoryBreakdown();
    fetchTrends();
  }, [fetchSummary, fetchTransactionReport, fetchCategoryBreakdown, fetchTrends]);

  const handleFilterChange = (filters: any) => {
    setReportFilters(filters);
    
    if (activeTab === 'transactions') {
      fetchTransactionReport({ ...filters, page: 1, limit: 10 });
    } else if (activeTab === 'categories') {
      fetchCategoryBreakdown(filters);
    } else if (activeTab === 'trends') {
      fetchTrends(filters);
    }
  };

  const handlePageChange = (page: number) => {
    fetchTransactionReport({ ...reportFilters, page, limit: 10 });
  };

  const handleTabChange = (tab: 'overview' | 'transactions' | 'categories' | 'trends') => {
    setActiveTab(tab);
    
    // Load data for the selected tab if not already loaded
    if (tab === 'transactions' && !transactionReport) {
      fetchTransactionReport({ page: 1, limit: 10 });
    } else if (tab === 'categories' && !categoryBreakdown) {
      fetchCategoryBreakdown();
    } else if (tab === 'trends' && !trendsReport) {
      fetchTrends();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              fetchSummary();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout currentPage="Dashboard">
      <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Overview of your financial data and comprehensive reporting tools
            </p>
          </div>

          {/* Summary Cards */}
          {summary && <SummaryCards summary={summary} />}

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'transactions', label: 'Transactions' },
                { key: 'categories', label: 'Categories' },
                { key: 'trends', label: 'Trends' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Reminders Section */}
              <UpcomingReminders />
              
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Spending Trends</h3>
                  <SpendingTrendsChart />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h3>
                  <CategoryPieChart type="Expense" />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenses</h3>
                  <IncomeExpenseBarChart />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Progress</h3>
                  <BudgetProgressChart />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Transaction Report</h2>
                <ExportButtons 
                  reportType="transactions" 
                  filters={reportFilters}
                  disabled={!transactionReport || transactionReport.transactions.length === 0}
                />
              </div>
              
              <ReportFilters 
                onFilterChange={handleFilterChange}
                showCategoryFilter={true}
                showTypeFilter={true}
              />
              
              {loading && !transactionReport ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : transactionReport ? (
                <TransactionReportTable 
                  report={transactionReport}
                  onPageChange={handlePageChange}
                />
              ) : null}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Category Breakdown</h2>
                <ExportButtons 
                  reportType="category-breakdown" 
                  filters={reportFilters}
                  disabled={!categoryBreakdown || categoryBreakdown.breakdown.length === 0}
                />
              </div>
              
              <ReportFilters 
                onFilterChange={handleFilterChange}
                showCategoryFilter={false}
                showTypeFilter={true}
              />
              
              {loading && !categoryBreakdown ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : categoryBreakdown ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <CategoryBreakdownTable 
                    breakdown={categoryBreakdown} 
                    showTypeIndicators={!reportFilters.type || reportFilters.type === ''}
                  />
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Visual Breakdown</h3>
                    <CategoryPieChart 
                      type={reportFilters.type || 'Expense'}
                      walletId={reportFilters.wallet_id}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Spending Trends</h2>
                <ExportButtons 
                  reportType="trends" 
                  filters={reportFilters}
                  disabled={!trendsReport || trendsReport.trends.length === 0}
                />
              </div>
              
              <ReportFilters 
                onFilterChange={handleFilterChange}
                showCategoryFilter={false}
                showTypeFilter={false}
              />
              
              {loading && !trendsReport ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : trendsReport ? (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Trends Chart</h3>
                    <SpendingTrendsChart 
                      walletId={reportFilters.wallet_id}
                      period={reportFilters.period || 'monthly'}
                      months={reportFilters.months || 6}
                      height={400}
                    />
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-semibold text-green-600">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP'
                          }).format(trendsReport.summary.avg_income)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">Avg Income</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-semibold text-red-600">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP'
                          }).format(trendsReport.summary.avg_expense)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">Avg Expense</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xl sm:text-2xl font-semibold ${trendsReport.summary.avg_net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP'
                          }).format(trendsReport.summary.avg_net)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">Avg Net</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                          {trendsReport.summary.total_periods}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">Periods</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
    </Layout>
  );
};

const DashboardPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard - Cashly</title>
        <meta name="description" content="Your personal finance dashboard with comprehensive reporting and analytics" />
      </Head>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </ProtectedRoute>
  );
};

export default DashboardPage;