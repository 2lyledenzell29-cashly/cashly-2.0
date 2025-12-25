import React, { useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useFamilyWallet } from '@/contexts/FamilyWalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet } from '@/types';
import FamilyWalletForm from '@/components/FamilyWalletForm';
import FamilyWalletMembers from '@/components/FamilyWalletMembers';
import InvitationCard from '@/components/InvitationCard';

const FamilyWalletsPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    familyWallets, 
    pendingInvitations, 
    loading, 
    error,
    createFamilyWallet,
    acceptInvitation,
    declineInvitation,
    clearError
  } = useFamilyWallet();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  const handleCreateWallet = async (data: { name: string }) => {
    try {
      await createFamilyWallet(data.name);
      setShowCreateForm(false);
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await declineInvitation(invitationId);
    } catch (error) {
      // Error is handled by the context
    }
  };

  const canCreateWallet = user && familyWallets.length < user.wallet_limit;

  return (
    <ProtectedRoute>
      <Head>
        <title>Family Wallets - Cashly</title>
        <meta name="description" content="Manage your family wallets and invitations" />
      </Head>
      
      <Layout currentPage="Family Wallets">
        <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Family Wallets</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage shared family wallets and collaborate on finances
                </p>
              </div>
              
              {canCreateWallet && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-3 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 w-full sm:w-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Family Wallet
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearError}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

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
            {loading && familyWallets.length === 0 && pendingInvitations.length === 0 && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            )}

            <div className="space-y-8">
              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Pending Invitations ({pendingInvitations.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pendingInvitations.map((invitation) => (
                      <InvitationCard
                        key={invitation.id}
                        invitation={invitation}
                        onAccept={handleAcceptInvitation}
                        onDecline={handleDeclineInvitation}
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Family Wallets */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  My Family Wallets ({familyWallets.length})
                </h2>

                {familyWallets.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No family wallets</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create a family wallet to start sharing finances with family members.
                    </p>
                    {canCreateWallet && (
                      <div className="mt-6">
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create Family Wallet
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {familyWallets.map((wallet) => (
                      <div key={wallet.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-2 border-green-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{wallet.name}</h3>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Family
                              </span>
                              {wallet.is_default && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              {wallet.user_id === user?.id ? 'Owner' : 'Member'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created {new Date(wallet.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => setSelectedWallet(wallet)}
                              className="flex-1 inline-flex justify-center items-center px-3 py-3 sm:py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Manage Members
                            </button>
                            <button
                              onClick={() => window.location.href = `/transactions?wallet=${wallet.id}`}
                              className="flex-1 inline-flex justify-center items-center px-3 py-3 sm:py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              View Transactions
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Create Family Wallet Form Modal */}
        {showCreateForm && (
          <FamilyWalletForm
            onSubmit={handleCreateWallet}
            onCancel={() => setShowCreateForm(false)}
            loading={loading}
          />
        )}

        {/* Family Wallet Members Modal */}
        {selectedWallet && (
          <FamilyWalletMembers
            wallet={selectedWallet}
            onClose={() => setSelectedWallet(null)}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default FamilyWalletsPage;