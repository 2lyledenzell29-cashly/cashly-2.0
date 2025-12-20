import React, { useState, useEffect } from 'react';
import { Wallet, Category } from '@/types';
import { WalletService } from '@/utils/walletApi';
import { CategoryService } from '@/utils/categoryApi';

interface ReportFiltersProps {
  onFilterChange: (filters: {
    wallet_id?: string;
    category_id?: string;
    type?: 'Income' | 'Expense' | '';
    start_date?: string;
    end_date?: string;
  }) => void;
  showCategoryFilter?: boolean;
  showTypeFilter?: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  onFilterChange,
  showCategoryFilter = true,
  showTypeFilter = true
}) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState({
    wallet_id: '',
    category_id: '',
    type: '' as 'Income' | 'Expense' | '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadWallets();
    if (showCategoryFilter) {
      loadCategories();
    }
  }, [showCategoryFilter]);

  const loadWallets = async () => {
    try {
      const data = await WalletService.getWallets();
      setWallets(data);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Clean up empty values before passing to parent
    const cleanFilters: any = {};
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== '') {
        cleanFilters[k] = v;
      }
    });
    
    onFilterChange(cleanFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      wallet_id: '',
      category_id: '',
      type: '' as 'Income' | 'Expense' | '',
      start_date: '',
      end_date: ''
    };
    setFilters(resetFilters);
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Wallet Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wallet
          </label>
          <select
            value={filters.wallet_id}
            onChange={(e) => handleFilterChange('wallet_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Wallets</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} {wallet.is_default && '(Default)'}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        {showCategoryFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category_id}
              onChange={(e) => handleFilterChange('category_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Type Filter */}
        {showTypeFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
        )}

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;