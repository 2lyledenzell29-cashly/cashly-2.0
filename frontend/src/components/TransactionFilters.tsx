import React from 'react';
import { useForm } from 'react-hook-form';
import { useWallet } from '@/contexts/WalletContext';
import { useCategory } from '@/contexts/CategoryContext';
import { TransactionFilters as Filters } from '@/utils/transactionApi';

interface TransactionFiltersProps {
  onFilter: (filters: Filters) => void;
  currentFilters: Filters;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({ onFilter, currentFilters }) => {
  const { wallets } = useWallet();
  const { categories } = useCategory();
  
  const { register, handleSubmit, reset } = useForm<Filters>({
    defaultValues: currentFilters,
  });

  const onSubmit = (data: Filters) => {
    onFilter(data);
  };

  const handleReset = () => {
    reset({
      wallet_id: '',
      category_id: '',
      type: undefined,
      start_date: '',
      end_date: '',
    });
    onFilter({});
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label htmlFor="wallet_id" className="block text-sm font-medium text-gray-700 mb-1">
            Wallet
          </label>
          <select
            {...register('wallet_id')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Wallets</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            {...register('category_id')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            {...register('type')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
        </div>

        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            {...register('start_date')}
            type="date"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            {...register('end_date')}
            type="date"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
};

export default TransactionFilters;