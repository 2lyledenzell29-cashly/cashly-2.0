'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Category } from '@/types';
import { CategoryService, CreateCategoryData, UpdateCategoryData } from '@/utils/categoryApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  createCategory: (data: CreateCategoryData) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
  getCategoriesByType: (type: 'Income' | 'Expense') => Category[];
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};

interface CategoryProviderProps {
  children: React.ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshCategories = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedCategories = await CategoryService.getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshCategories();
    } else {
      setCategories([]);
    }
  }, [user]);

  const createCategory = async (data: CreateCategoryData): Promise<void> => {
    try {
      setLoading(true);
      const newCategory = await CategoryService.createCategory(data);
      setCategories(prev => [...prev, newCategory]);
      toast.success('Category created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, data: UpdateCategoryData): Promise<void> => {
    try {
      setLoading(true);
      const updatedCategory = await CategoryService.updateCategory(id, data);
      setCategories(prev => prev.map(category => 
        category.id === id ? updatedCategory : category
      ));
      toast.success('Category updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await CategoryService.deleteCategory(id);
      setCategories(prev => prev.filter(category => category.id !== id));
      toast.success('Category deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCategoriesByType = (type: 'Income' | 'Expense'): Category[] => {
    return categories.filter(category => category.type === type);
  };

  const value: CategoryContextType = {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
    getCategoriesByType,
  };

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
};