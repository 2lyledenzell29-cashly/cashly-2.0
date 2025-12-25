'use client';

import React from 'react';
import { useWallet } from '@/contexts/WalletContext';

interface WalletSelectorProps {
  selectedWalletId: string | null;
  onWalletChange: (walletId: string | null) => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ selectedWalletId, onWalletChange }) => {
  const { wallets, defaultWallet } = useWallet();

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Select Wallet</h3>
      <div className="flex flex-wrap gap-2">
        {/* All Wallets Chip */}
        <button
          onClick={() => onWalletChange(null)}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedWalletId === null
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
              : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
          }`}
        >
          All Wallets
        </button>

        {/* Individual Wallet Chips */}
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => onWalletChange(wallet.id)}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedWalletId === wallet.id
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            {wallet.name}
            {wallet.is_default && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-blue-600 bg-blue-200 rounded-full">
                ★
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WalletSelector;