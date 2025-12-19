import React, { useState } from 'react';
import { Transaction } from '@/types';
import { useTransaction } from '@/contexts/TransactionContext';
import { useWallet } from '@/contexts/WalletContext';
import { useCategory } from '@/contexts/CategoryContext';

interface TransactionListProps {
  onEdit: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ onEdit }) => {
  const { transactions, deleteTransaction, loading } = useTransaction();
  const { wallets } = useWallet();
  const { categories } = useCategory();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet?.name || 'Unknown Wallet';
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirm(null);
    } catch (error) {
      // Error is handled in the context
    }
  };

  const formatAmount = (amount: number, type: 'Income' | 'Expense') => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    
    return type === 'Income' ? `+${formatted}` : `-${formatted}`;
  };

  const getAmountColor = (type: 'Income' | 'Expense') => {
    return type === 'Income' ? 'text-green-600' : 'text-red-600';
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first transaction.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'Income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'Income' ? (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">{transaction.title}</p>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span>{getCategoryName(transaction.category_id)}</span>
                    <span className="mx-2">•</span>
                    <span>{getWalletName(transaction.wallet_id)}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="text-right mr-4">
                  <p className={`text-sm font-medium ${getAmountColor(transaction.type)}`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(transaction)}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setDeleteConfirm(transaction.id)}
                    disabled={loading}
                    className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Transaction</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? '...' : 'Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;