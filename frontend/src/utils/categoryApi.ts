import { ApiResponse, Category } from '@/types';
import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface CreateCategoryData {
  name: string;
  type: 'Income' | 'Expense';
  wallet_id?: string; // For family wallet categories
}

export interface UpdateCategoryData {
  name: string;
  type: 'Income' | 'Expense';
}

export class CategoryService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = AuthService.getToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const result: ApiResponse<T> = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Request failed');
    }

    return result;
  }

  static async getCategories(): Promise<Category[]> {
    const response = await this.makeRequest<Category[]>('/categories');
    return response.data || [];
  }

  static async createCategory(data: CreateCategoryData): Promise<Category> {
    const response = await this.makeRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.data) {
      throw new Error('Failed to create category');
    }
    
    return response.data;
  }

  static async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    const response = await this.makeRequest<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.data) {
      throw new Error('Failed to update category');
    }
    
    return response.data;
  }

  static async deleteCategory(id: string): Promise<void> {
    await this.makeRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  }
}