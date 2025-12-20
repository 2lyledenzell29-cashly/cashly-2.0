import React, { useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useCategory } from '@/contexts/CategoryContext';
import { Category } from '@/types';
import CategoryCard from '@/components/CategoryCard';
import CategoryForm from '@/components/CategoryForm';

const CategoriesPage: React.FC = () => {
  const { categories, loading, createCategory, updateCategory, getCategoriesByType } = useCategory();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');

  const handleCreateCategory = async (data: { name: string; type: 'Income' | 'Expense' }) => {
    await createCategory(data);
    setShowForm(false);
  };

  const handleUpdateCategory = async (data: { name: string; type: 'Income' | 'Expense' }) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
      setEditingCategory(null);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const getFilteredCategories = () => {
    if (filterType === 'All') {
      return categories;
    }
    return getCategoriesByType(filterType);
  };

  const filteredCategories = getFilteredCategories();
  const incomeCount = getCategoriesByType('Income').length;
  const expenseCount = getCategoriesByType('Expense').length;

  return (
    <ProtectedRoute>
      <Head>
        <title>Categories - Wallet App</title>
        <meta name="description" content="Manage your transaction categories" />
      </Head>
      
      <Layout currentPage="Categories">
        <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Organize your transactions with custom categories
                </p>
              </div>
              
              <button
                onClick={() => setShowForm(true)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Category
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Categories</dt>
                        <dd className="text-lg font-medium text-gray-900">{categories.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Income Categories</dt>
                        <dd className="text-lg font-medium text-gray-900">{incomeCount}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Expense Categories</dt>
                        <dd className="text-lg font-medium text-gray-900">{expenseCount}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                {(['All', 'Income', 'Expense'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      filterType === type
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {type}
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      filterType === type
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {type === 'All' ? categories.length : 
                       type === 'Income' ? incomeCount : expenseCount}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Loading State */}
            {loading && categories.length === 0 && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {filterType === 'All' ? 'No categories' : `No ${filterType.toLowerCase()} categories`}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterType === 'All' 
                    ? 'Get started by creating your first category.'
                    : `Create your first ${filterType.toLowerCase()} category.`
                  }
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Category
                  </button>
                </div>
              </div>
            )}

            {/* Categories Grid */}
            {filteredCategories.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleEditCategory}
                  />
                ))}
              </div>
            )}
        </div>

        {/* Create/Edit Form Modal */}
        {(showForm || editingCategory) && (
          <CategoryForm
            category={editingCategory || undefined}
            onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
            onCancel={handleCancelForm}
            loading={loading}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default CategoriesPage;