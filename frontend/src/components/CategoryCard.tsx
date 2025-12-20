'use client';

import React, { useState } from 'react';
import { Category } from '@/types';
import { useCategory } from '@/contexts/CategoryContext';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEdit }) => {
  const { deleteCategory, loading } = useCategory();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteCategory(category.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error is handled in the context
    }
  };

  const getTypeColor = (type: 'Income' | 'Expense') => {
    return type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getTypeIcon = (type: 'Income' | 'Expense') => {
    if (type === 'Income') {
      return (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            category.type === 'Income' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {getTypeIcon(category.type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(category.type)}`}>
              {category.type}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(category)}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Edit category"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            className="text-gray-400 hover:text-red-600 disabled:opacity-50"
            title="Delete category"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-500">
          Created {new Date(category.created_at).toLocaleDateString()}
        </p>
        {category.wallet_id && (
          <p className="text-sm text-gray-500 mt-1">
            Family wallet category
          </p>
        )}
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
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Category</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{category.name}"? This action cannot be undone.
                  Transactions using this category will become uncategorized.
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

export default CategoryCard;