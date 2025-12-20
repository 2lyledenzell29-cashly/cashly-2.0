import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Transaction } from '@/types';
import { useWallet } from '@/contexts/WalletContext';
import { useCategory } from '@/contexts/CategoryContext';
import SearchableSelect from './SearchableSelect';

interface TransactionFormData {
  title: string;
  amount: number;
  type: 'Income' | 'Expense';
  category_id: string;
  wallet_id: string;
}

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { wallets, defaultWallet } = useWallet();
  const { getCategoriesByType, createCategory } = useCategory();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    watch,
    control,
  } = useForm<TransactionFormData>({
    defaultValues: {
      title: transaction?.title || '',
      amount: transaction?.amount || 0,
      type: transaction?.type || 'Expense',
      category_id: transaction?.category_id || '',
      wallet_id: transaction?.wallet_id || defaultWallet?.id || '',
    },
  });

  const watchType = watch('type');
  const filteredCategories = getCategoriesByType(watchType);

  const handleCreateNewCategory = async (categoryName: string) => {
    try {
      const newCategoryData = {
        name: categoryName,
        type: watchType,
      };
      
      await createCategory(newCategoryData);
      
      // Wait a bit for the category to be added to the context state
      setTimeout(() => {
        const updatedCategories = getCategoriesByType(watchType);
        const newCategory = updatedCategories.find(cat => cat.name === categoryName);
        if (newCategory) {
          const formData = watch();
          reset({
            ...formData,
            category_id: newCategory.id
          });
        }
      }, 100);
    } catch (error) {
      // Error is already handled in the context with toast
    }
  };

  // Convert categories to options for SearchableSelect
  const categoryOptions = filteredCategories.map(category => ({
    value: category.id,
    label: category.name
  }));

  useEffect(() => {
    if (transaction) {
      reset({
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        category_id: transaction.category_id || '',
        wallet_id: transaction.wallet_id,
      });
    }
  }, [transaction, reset]);

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      await onSubmit(data);
      if (!transaction) {
        reset(); // Reset form only for new transactions
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Operation failed',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-lg shadow-lg rounded-lg bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            {transaction ? 'Edit Transaction' : 'Create New Transaction'}
          </h3>
          
          <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                {...register('title', {
                  required: 'Title is required',
                  minLength: {
                    value: 2,
                    message: 'Title must be at least 2 characters',
                  },
                })}
                type="text"
                className="mt-1 block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                placeholder="Enter transaction title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                {...register('amount', {
                  required: 'Amount is required',
                  min: {
                    value: 0.01,
                    message: 'Amount must be greater than 0',
                  },
                  valueAsNumber: true,
                })}
                type="number"
                step="0.01"
                className="mt-1 block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                {...register('type', { required: 'Type is required' })}
                className="mt-1 block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="wallet_id" className="block text-sm font-medium text-gray-700">
                Wallet
              </label>
              <select
                {...register('wallet_id', { required: 'Wallet is required' })}
                className="mt-1 block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
              >
                <option value="">Select a wallet</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} {wallet.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              {errors.wallet_id && (
                <p className="mt-1 text-sm text-red-600">{errors.wallet_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                Category (Optional)
              </label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={categoryOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search for a category..."
                    className="mt-1"
                    allowEmpty={true}
                    emptyLabel="Uncategorized"
                    onCreateNew={handleCreateNewCategory}
                    createNewLabel={`Create new ${watchType.toLowerCase()} category`}
                  />
                )}
              />
            </div>

            {errors.root && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {errors.root.message}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 sm:px-4 sm:py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {loading ? '...' : transaction ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;