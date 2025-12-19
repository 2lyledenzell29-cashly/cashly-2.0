import React, { useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet } from '@/types';
import WalletCard from '@/components/WalletCard';
import WalletForm from '@/components/WalletForm';

const WalletsPage: React.FC = () => {
  const { wallets, loading, createWallet, updateWallet } = useWallet();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const handleCreateWallet = async (data: { name: string }) => {
    await createWallet(data.name);
    setShowForm(false);
  };

  const handleUpdateWallet = async (data: { name: string }) => {
    if (editingWallet) {
      await updateWallet(editingWallet.id, data.name);
      setEditingWallet(null);
    }
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingWallet(null);
  };

  const canCreateWallet = user && wallets.length < user.wallet_limit;

  return (
    <ProtectedRoute>
      <Head>
        <title>Wallets - Wallet App</title>
        <meta name="description" content="Manage your wallets" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Wallets</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your financial wallets ({wallets.length}/{user?.wallet_limit || 1} used)
                </p>
              </div>
              
              {canCreateWallet && (
                <button
                  onClick={() => setShowForm(true)}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Wallet
                </button>
              )}
            </div>

            {/* Wallet Limit Warning */}
            {!canCreateWallet && user && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Wallet Limit Reached
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You have reached your wallet limit of {user.wallet_limit} wallet{user.wallet_limit !== 1 ? 's' : ''}. 
                        Contact an administrator to increase your limit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && wallets.length === 0 && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Empty State */}
            {!loading && wallets.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No wallets</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first wallet.
                </p>
                {canCreateWallet && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Wallet
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Wallets Grid */}
            {wallets.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {wallets.map((wallet) => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    onEdit={handleEditWallet}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {(showForm || editingWallet) && (
        <WalletForm
          wallet={editingWallet || undefined}
          onSubmit={editingWallet ? handleUpdateWallet : handleCreateWallet}
          onCancel={handleCancelForm}
          loading={loading}
        />
      )}
    </ProtectedRoute>
  );
};

export default WalletsPage;