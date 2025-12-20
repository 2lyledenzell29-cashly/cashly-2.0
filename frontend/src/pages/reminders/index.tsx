import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { ReminderList } from '@/components/ReminderList';
import { ReminderForm } from '@/components/ReminderForm';

const RemindersPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refreshWallets } = useWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'overdue' | 'Payment' | 'Receivable'>('all');

  useEffect(() => {
    if (user) {
      // Fetch user wallets to populate wallet options
      refreshWallets();
    }
  }, [user, refreshWallets]);

  useEffect(() => {
    // Handle URL parameters
    if (router.isReady) {
      const { filter, create } = router.query;
      
      if (filter && typeof filter === 'string') {
        const validFilters = ['all', 'upcoming', 'overdue', 'Payment', 'Receivable'];
        if (validFilters.includes(filter)) {
          setFilterType(filter as any);
        }
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
        <title>Reminders - Wallet App</title>
        <meta name="description" content="Manage your payment and receivable reminders" />
      </Head>
      
      <Layout currentPage="Reminders">
        {showCreateForm ? (
          <div className="max-w-2xl mx-auto">
            <ReminderForm
              onSuccess={handleCreateSuccess}
              onCancel={handleCreateCancel}
            />
          </div>
        ) : (
          <ReminderList
            filterType={filterType}
            showCreateButton={true}
            onCreateClick={handleCreateClick}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default RemindersPage;