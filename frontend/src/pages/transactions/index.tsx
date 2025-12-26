import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useTransaction } from '@/contexts/TransactionContext';
import { useWallet } from '@/contexts/WalletContext';
import { useCategory } from '@/contexts/CategoryContext';
import { Transaction } from '@/types';
import { TransactionFilters } from '@/utils/transactionApi';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import TransactionFiltersComponent from '@/components/TransactionFilters';
import WalletSelector from '@/components/WalletSelector';

const TransactionsPage: React.FC = () => {
  const {
    total,
    page,
    totalPages,
    loading,
    summary,
    fetchTransactions,
    fetchTransactionsAndSummary,
    createTransaction,
    updateTransaction,
  } = useTransaction();

  const { refreshWallets, defaultWallet, wallets } = useWallet();
  const { refreshCategories } = useCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<Omit<TransactionFilters, 'wallet_id'>>({
    page: 1,
    limit: 10,
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Load wallets and categories once on mount
    refreshWallets();
    refreshCategories();
  }, []);

  // Initialize with default wallet when wallets are loaded
  useEffect(() => {
    if (defaultWallet && !initialized) {
      setSelectedWalletId(defaultWallet.id);
      const initialFilters = {
        ...currentFilters,
        wallet_id: defaultWallet.id,
      };
      fetchTransactionsAndSummary(initialFilters);
      setInitialized(true);
    }
  }, [defaultWallet, initialized]);

  const buildFilters = (baseFilters: Omit<TransactionFilters, 'wallet_id'>) => {
    return {
      ...baseFilters,
      wallet_id: selectedWalletId || undefined,
    };
  };

  const handleCreateTransaction = async (data: any) => {
    await createTransaction(data);
    setShowForm(false);
    // Refresh data
    const filters = buildFilters(currentFilters);
    fetchTransactionsAndSummary(filters);
  };

  const handleUpdateTransaction = async (data: any) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
      // Refresh data
      const filters = buildFilters(currentFilters);
      fetchTransactionsAndSummary(filters);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFilter = (filters: Omit<TransactionFilters, 'wallet_id'>) => {
    const newFilters = {
      ...filters,
      page: 1,
      limit: 10,
    };
    setCurrentFilters(newFilters);
    // Fetch data with new filters
    const fullFilters = buildFilters(newFilters);
    fetchTransactionsAndSummary(fullFilters);
  };

  const handleWalletChange = (walletId: string | null) => {
    setSelectedWalletId(walletId);
    // Fetch data with new wallet selection - use the new walletId directly
    const filters = {
      ...currentFilters,
      wallet_id: walletId || undefined,
    };
    fetchTransactionsAndSummary(filters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = {
      ...currentFilters,
      page: newPage,
    };
    setCurrentFilters(newFilters);
    // Fetch data with new page
    const fullFilters = buildFilters(newFilters);
    fetchTransactions(fullFilters);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Transactions - Cashly</title>
        <meta name="description" content="Manage your transactions" />
      </Head>

      <Layout currentPage="Transactions">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your income and expenses
              </p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-3 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 w-full sm:w-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Transaction
            </button>
          </div>

          {/* Summary Cards */}
          <div className="mb-6">
            {/* Balance Card - Large and Prominent - Clickable */}
            <button
              onClick={() => setShowSummaryDetails(!showSummaryDetails)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-xl mb-4 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl font-medium text-blue-100 mb-2">Current Balance</h3>
                    <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${summary.balance >= 0 ? 'text-white' : 'text-red-200'}`}>
                      {formatCurrency(summary.balance)}
                    </p>
                    <p className="text-sm text-blue-200 mt-2">Click to {showSummaryDetails ? 'hide' : 'view'} details</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-4">
                    <svg className="h-12 w-12 sm:h-16 sm:w-16 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <svg
                      className={`h-6 w-6 text-blue-200 transition-transform duration-200 ${showSummaryDetails ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Collapsible Summary Details */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showSummaryDetails ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Income</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.totalIncome)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.totalExpense)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <div className="ml-4 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                          <dd className="text-lg font-medium text-gray-900">{summary.transactionCount}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Selection */}
          <WalletSelector
            selectedWalletId={selectedWalletId}
            onWalletChange={handleWalletChange}
          />

          {/* Filters */}
          <TransactionFiltersComponent onFilter={handleFilter} currentFilters={currentFilters} />

          {/* Transaction List */}
          <TransactionList onEdit={handleEditTransaction} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="relative inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="relative inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((page - 1) * 10) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * 10, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Form Modal */}
        {(showForm || editingTransaction) && (
          <TransactionForm
            transaction={editingTransaction || undefined}
            onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
            onCancel={handleCancelForm}
            loading={loading}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default TransactionsPage;