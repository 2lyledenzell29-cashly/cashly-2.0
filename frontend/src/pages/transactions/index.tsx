import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useTransaction } from '@/contexts/TransactionContext';
import { Transaction } from '@/types';
import { TransactionFilters } from '@/utils/transactionApi';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import TransactionFiltersComponent from '@/components/TransactionFilters';

const TransactionsPage: React.FC = () => {
  const { 
    transactions, 
    total, 
    page, 
    totalPages, 
    loading, 
    summary,
    fetchTransactions, 
    createTransaction, 
    updateTransaction,
    fetchSummary 
  } = useTransaction();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentFilters, setCurrentFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    fetchTransactions(currentFilters);
    fetchSummary(currentFilters);
  }, [currentFilters]);

  const handleCreateTransaction = async (data: any) => {
    await createTransaction(data);
    setShowForm(false);
    // Refresh data
    fetchTransactions(currentFilters);
    fetchSummary(currentFilters);
  };

  const handleUpdateTransaction = async (data: any) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
      // Refresh data
      fetchTransactions(currentFilters);
      fetchSummary(currentFilters);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFilter = (filters: TransactionFilters) => {
    setCurrentFilters({
      ...filters,
      page: 1,
      limit: 10,
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Transactions - Wallet App</title>
        <meta name="description" content="Manage your transactions" />
      </Head>
      
      <Layout currentPage="Transactions">
        <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Track your income and expenses
                </p>
              </div>
              
              <button
                onClick={() => setShowForm(true)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Transaction
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Income</dt>
                        <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.totalIncome)}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                        <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.totalExpense)}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Balance</dt>
                        <dd className={`text-lg font-medium ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(summary.balance)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                        <dd className="text-lg font-medium text-gray-900">{summary.transactionCount}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === page
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