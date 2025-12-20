import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { BudgetList } from '@/components/BudgetList';
import { BudgetForm } from '@/components/BudgetForm';

const BudgetsPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refreshWallets } = useWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user) {
      // Fetch user wallets to populate wallet options
      refreshWallets();
    }
  }, [user, refreshWallets]);

  useEffect(() => {
    // Handle URL parameters
    if (router.isReady) {
      const { wallet, create } = router.query;
      
      if (wallet && typeof wallet === 'string') {
        setSelectedWalletId(wallet);
      }
      
      if (create === 'true') {
        setShowCreateForm(true);
      }
    }
  }, [router.isReady, router.query]);

  const handleCreateClick = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Budgets - Wallet App</title>
        <meta name="description" content="Manage your budgets and track spending" />
      </Head>
      
      <Layout currentPage="Budgets">
        {showCreateForm ? (
          <div className="max-w-2xl mx-auto">
            <BudgetForm
              walletId={selectedWalletId}
              onSuccess={handleCreateSuccess}
              onCancel={handleCreateCancel}
            />
          </div>
        ) : (
          <BudgetList
            walletId={selectedWalletId}
            showCreateButton={true}
            onCreateClick={handleCreateClick}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default BudgetsPage;