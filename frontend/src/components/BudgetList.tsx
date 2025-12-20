'use client';

import React, { useState, useEffect } from 'react';
import { Budget, Wallet } from '@/types';
import { useBudget } from '@/contexts/BudgetContext';
import { useWallet } from '@/contexts/WalletContext';
import { BudgetCard } from './BudgetCard';

interface BudgetListProps {
  walletId?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export const BudgetList: React.FC<BudgetListProps> = ({
  walletId,
  showCreateButton = true,
  onCreateClick,
}) => {
  const { budgets, fetchUserBudgets, fetchWalletBudgets, loading } = useBudget();
  const { wallets } = useWallet();
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>(walletId || 'all');

  useEffect(() => {
    if (walletId) {
      // Fetch budgets for specific wallet
      fetchWalletBudgets(walletId);
    } else {
      // Fetch all user budgets
      fetchUserBudgets();
    }
  }, [walletId, fetchUserBudgets, fetchWalletBudgets]);

  useEffect(() => {
    // Filter budgets based on selected wallet
    if (selectedWallet === 'all') {
      setFilteredBudgets(budgets);
    } else {
      setFilteredBudgets(budgets.filter(budget => budget.wallet_id === selectedWallet));
    }
  }, [budgets, selectedWallet]);

  const handleWalletFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWallet(e.target.value);
  };

  const getWalletName = (walletId: string): string => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  const sortedBudgets = [...filteredBudgets].sort((a, b) => {
    // Sort by month descending (newest first)
    return b.month.localeCompare(a.month);
  });

  if (loading && budgets.length === 0) {
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
            {walletId ? `${getWalletName(walletId)} Budgets` : 'All Budgets'}
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your monthly spending limits and track progress
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Wallet Filter (only show if not filtering by specific wallet) */}
          {!walletId && wallets.length > 1 && (
            <select
              value={selectedWallet}
              onChange={handleWalletFilterChange}
              className="px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
            >
              <option value="all">All Wallets</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name} {wallet.is_default && '(Default)'}
                </option>
              ))}
            </select>
          )}

          {/* Create Budget Button */}
          {showCreateButton && (
            <button
              onClick={onCreateClick}
              className="bg-blue-600 text-white px-6 py-3 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
            >
              Create Budget
            </button>
          )}
        </div>
      </div>

      {/* Budget Cards */}
      {sortedBudgets.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={() => {
                // Refresh budgets after edit
                if (walletId) {
                  fetchWalletBudgets(walletId);
                } else {
                  fetchUserBudgets();
                }
              }}
              onDelete={() => {
                // Refresh budgets after delete
                if (walletId) {
                  fetchWalletBudgets(walletId);
                } else {
                  fetchUserBudgets();
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets found</h3>
          <p className="text-gray-600 mb-6 px-4">
            {selectedWallet === 'all' 
              ? "You haven't created any budgets yet. Start by creating your first budget to track your spending."
              : `No budgets found for ${getWalletName(selectedWallet)}. Create a budget to start tracking spending for this wallet.`
            }
          </p>
          {showCreateButton && (
            <button
              onClick={onCreateClick}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Create Your First Budget
            </button>
          )}
        </div>
      )}
    </div>
  );
};