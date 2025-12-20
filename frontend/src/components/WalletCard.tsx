'use client';

import React, { useState } from 'react';
import { Wallet } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { BudgetStatus } from './BudgetStatus';

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, onEdit }) => {
  const { deleteWallet, setDefaultWallet, loading } = useWallet();
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteWallet(wallet.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error is handled in the context
    }
  };

  const handleSetDefault = async () => {
    if (!wallet.is_default) {
      try {
        await setDefaultWallet(wallet.id);
      } catch (error) {
        // Error is handled in the context
      }
    }
  };

  const canDelete = !wallet.is_default; // Can't delete default wallet

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${
      wallet.is_default ? 'border-blue-500' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{wallet.name}</h3>
            {wallet.is_default && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Default
              </span>
            )}
            {wallet.is_family && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Family
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Created {new Date(wallet.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!wallet.is_default && (
            <button
              onClick={handleSetDefault}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              Set as Default
            </button>
          )}
          
          <button
            onClick={() => onEdit(wallet)}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="text-gray-400 hover:text-red-600 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Budget Status Section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Current Month Budget</h4>
          <button
            onClick={() => window.location.href = `/budgets?wallet=${wallet.id}`}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Manage
          </button>
        </div>
        <BudgetStatus 
          walletId={wallet.id} 
          compact={true} 
          showCreateButton={true}
          onCreateClick={() => window.location.href = `/budgets?wallet=${wallet.id}&create=true`}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Wallet</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{wallet.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? '...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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

export default WalletCard;