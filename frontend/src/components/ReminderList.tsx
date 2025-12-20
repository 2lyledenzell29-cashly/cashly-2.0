'use client';

import React, { useState, useEffect } from 'react';
import { Reminder } from '@/types';
import { useReminder } from '@/contexts/ReminderContext';
import { useWallet } from '@/contexts/WalletContext';
import { ReminderCard } from './ReminderCard';

interface ReminderListProps {
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  filterType?: 'all' | 'upcoming' | 'overdue' | 'Payment' | 'Receivable';
}

export const ReminderList: React.FC<ReminderListProps> = ({
  showCreateButton = true,
  onCreateClick,
  filterType = 'all',
}) => {
  const { 
    reminders, 
    upcomingReminders, 
    overdueReminders, 
    fetchUserReminders, 
    fetchUpcomingReminders, 
    fetchOverdueReminders,
    fetchRemindersByType,
    loading 
  } = useReminder();
  const { wallets } = useWallet();
  
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>(filterType);
  const [selectedWallet, setSelectedWallet] = useState<string>('all');

  useEffect(() => {
    // Fetch reminders based on filter type
    switch (filterType) {
      case 'upcoming':
        fetchUpcomingReminders();
        break;
      case 'overdue':
        fetchOverdueReminders();
        break;
      case 'Payment':
      case 'Receivable':
        fetchRemindersByType(filterType);
        break;
      default:
        fetchUserReminders();
        break;
    }
  }, [filterType, fetchUserReminders, fetchUpcomingReminders, fetchOverdueReminders, fetchRemindersByType]);

  useEffect(() => {
    // Apply filters to reminders
    let baseReminders: Reminder[] = [];
    
    switch (selectedFilter) {
      case 'upcoming':
        baseReminders = upcomingReminders;
        break;
      case 'overdue':
        baseReminders = overdueReminders;
        break;
      case 'Payment':
        baseReminders = reminders.filter(r => r.type === 'Payment');
        break;
      case 'Receivable':
        baseReminders = reminders.filter(r => r.type === 'Receivable');
        break;
      case 'active':
        baseReminders = reminders.filter(r => r.is_active);
        break;
      case 'inactive':
        baseReminders = reminders.filter(r => !r.is_active);
        break;
      default:
        baseReminders = reminders;
        break;
    }

    // Apply wallet filter
    if (selectedWallet !== 'all') {
      if (selectedWallet === 'none') {
        baseReminders = baseReminders.filter(r => !r.wallet_id);
      } else {
        baseReminders = baseReminders.filter(r => r.wallet_id === selectedWallet);
      }
    }

    setFilteredReminders(baseReminders);
  }, [reminders, upcomingReminders, overdueReminders, selectedFilter, selectedWallet]);

  const handleFilterChange = async (filter: string) => {
    setSelectedFilter(filter);
    
    // Fetch data if needed
    switch (filter) {
      case 'upcoming':
        await fetchUpcomingReminders();
        break;
      case 'overdue':
        await fetchOverdueReminders();
        break;
      case 'Payment':
        await fetchRemindersByType('Payment');
        break;
      case 'Receivable':
        await fetchRemindersByType('Receivable');
        break;
      default:
        await fetchUserReminders();
        break;
    }
  };

  const handleWalletFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWallet(e.target.value);
  };

  const getWalletName = (walletId: string): string => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  const sortedReminders = [...filteredReminders].sort((a, b) => {
    // Sort by due date ascending (earliest first)
    const dateA = new Date(a.due_date);
    const dateB = new Date(b.due_date);
    return dateA.getTime() - dateB.getTime();
  });

  const getFilterTitle = (): string => {
    switch (selectedFilter) {
      case 'upcoming':
        return 'Upcoming Reminders';
      case 'overdue':
        return 'Overdue Reminders';
      case 'Payment':
        return 'Payment Reminders';
      case 'Receivable':
        return 'Receivable Reminders';
      case 'active':
        return 'Active Reminders';
      case 'inactive':
        return 'Inactive Reminders';
      default:
        return 'All Reminders';
    }
  };

  const getFilterDescription = (): string => {
    switch (selectedFilter) {
      case 'upcoming':
        return 'Reminders due in the next 7 days';
      case 'overdue':
        return 'Reminders that are past their due date';
      case 'Payment':
        return 'Outgoing payment obligations';
      case 'Receivable':
        return 'Expected incoming payments';
      case 'active':
        return 'Currently active reminders';
      case 'inactive':
        return 'Deactivated reminders';
      default:
        return 'Manage your payment and receivable reminders';
    }
  };

  if (loading && filteredReminders.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {getFilterTitle()}
          </h2>
          <p className="text-gray-600 mt-1">
            {getFilterDescription()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter Dropdown */}
          <select
            value={selectedFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
          >
            <option value="all">All Reminders</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
            <option value="Payment">Payments</option>
            <option value="Receivable">Receivables</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Wallet Filter */}
          {wallets.length > 0 && (
            <select
              value={selectedWallet}
              onChange={handleWalletFilterChange}
              className="px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
            >
              <option value="all">All Wallets</option>
              <option value="none">No Wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name} {wallet.is_default && '(Default)'}
                </option>
              ))}
            </select>
          )}

          {/* Create Reminder Button */}
          {showCreateButton && (
            <button
              onClick={onCreateClick}
              className="bg-blue-600 text-white px-6 py-3 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap w-full sm:w-auto"
            >
              Create Reminder
            </button>
          )}
        </div>
      </div>

      {/* Reminder Cards */}
      {sortedReminders.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              showUpcoming={selectedFilter === 'upcoming' || selectedFilter === 'overdue'}
              onEdit={() => {
                // Refresh reminders after edit
                fetchUserReminders();
                if (selectedFilter === 'upcoming') {
                  fetchUpcomingReminders();
                }
                if (selectedFilter === 'overdue') {
                  fetchOverdueReminders();
                }
              }}
              onDelete={() => {
                // Refresh reminders after delete
                fetchUserReminders();
                if (selectedFilter === 'upcoming') {
                  fetchUpcomingReminders();
                }
                if (selectedFilter === 'overdue') {
                  fetchOverdueReminders();
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedFilter === 'all' ? 'No reminders found' : `No ${selectedFilter.toLowerCase()} reminders`}
          </h3>
          <p className="text-gray-600 mb-6 px-4">
            {selectedFilter === 'all' 
              ? "You haven't created any reminders yet. Start by creating your first reminder to track payments and receivables."
              : selectedFilter === 'upcoming'
              ? "No reminders are due in the next 7 days."
              : selectedFilter === 'overdue'
              ? "Great! You don't have any overdue reminders."
              : `No ${selectedFilter.toLowerCase()} reminders found with the current filters.`
            }
          </p>
          {showCreateButton && selectedFilter === 'all' && (
            <button
              onClick={onCreateClick}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Create Your First Reminder
            </button>
          )}
        </div>
      )}
    </div>
  );
};