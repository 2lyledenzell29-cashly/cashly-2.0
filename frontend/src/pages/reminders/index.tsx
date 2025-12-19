import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      // Fetch user wallets to populate wallet options
      refreshWallets();
    }
  }, [user, authLoading, router, refreshWallets]);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">Wallet App</h1>
              <div className="hidden md:flex space-x-6">
                <button
                  onClick={() => router.push('/')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/wallets')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Wallets
                </button>
                <button
                  onClick={() => router.push('/transactions')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Transactions
                </button>
                <button
                  onClick={() => router.push('/categories')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Categories
                </button>
                <button
                  onClick={() => router.push('/budgets')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Budgets
                </button>
                <span className="text-blue-600 px-3 py-2 text-sm font-medium border-b-2 border-blue-600">
                  Reminders
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.username}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/auth/login');
                }}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  );
};

export default RemindersPage;