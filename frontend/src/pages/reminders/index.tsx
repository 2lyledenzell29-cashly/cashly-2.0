import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { ReminderList } from '@/components/ReminderList';
import { ReminderCalendar } from '@/components/ReminderCalendar';
import { ReminderForm } from '@/components/ReminderForm';
import { Reminder } from '@/types';

const RemindersPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshWallets } = useWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'overdue' | 'Payment' | 'Receivable'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (user) {
      // Fetch user wallets to populate wallet options
      refreshWallets();
    }
  }, [user, refreshWallets]);

  useEffect(() => {
    // Handle URL parameters
    if (router.isReady) {
      const { filter, create, view } = router.query;
      
      if (filter && typeof filter === 'string') {
        const validFilters = ['all', 'upcoming', 'overdue', 'Payment', 'Receivable'];
        if (validFilters.includes(filter)) {
          setFilterType(filter as any);
        }
      }
      
      if (create === 'true') {
        setShowCreateForm(true);
      }

      if (view && typeof view === 'string') {
        const validViews = ['list', 'calendar'];
        if (validViews.includes(view)) {
          setViewMode(view as any);
        }
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

  const handleReminderClick = (reminder: Reminder) => {
    // You can add more logic here, like opening a detail modal
    console.log('Reminder clicked:', reminder);
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Reminders - Cashly</title>
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
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reminders</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your payment and receivable reminders</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <button
                  onClick={handleCreateClick}
                  className="bg-blue-600 text-white px-6 py-3 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Reminder
                </button>
                
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'calendar'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendar
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            {viewMode === 'calendar' ? (
              <ReminderCalendar onReminderClick={handleReminderClick} />
            ) : (
              <ReminderList
                filterType={filterType}
                showCreateButton={false}
                onCreateClick={handleCreateClick}
              />
            )}
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default RemindersPage;