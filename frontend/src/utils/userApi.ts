import { ApiResponse, UserResponse } from '@/types';
import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UpdateProfileData {
  username?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AdminUpdateUserData {
  username?: string;
  email?: string;
  role?: 'user' | 'admin';
  wallet_limit?: number;
}

export interface AdminCreateUserData {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  wallet_limit?: number;
}

export class UserService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = AuthService.getToken();
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
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

  // User profile management
  static async updateProfile(data: UpdateProfileData): Promise<UserResponse> {
    const response = await this.makeRequest<UserResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.data) {
      throw new Error('Failed to update profile');
    }
    
    return response.data;
  }

  static async changePassword(data: ChangePasswordData): Promise<void> {
    await this.makeRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin user management
  static async getAllUsers(): Promise<UserResponse[]> {
    const response = await this.makeRequest<UserResponse[]>('/admin/users');
    return response.data || [];
  }

  static async getUserById(id: string): Promise<UserResponse> {
    const response = await this.makeRequest<UserResponse>(`/admin/users/${id}`);
    
    if (!response.data) {
      throw new Error('User not found');
    }
    
    return response.data;
  }

  static async createUser(data: AdminCreateUserData): Promise<UserResponse> {
    const response = await this.makeRequest<UserResponse>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.data) {
      throw new Error('Failed to create user');
    }
    
    return response.data;
  }

  static async updateUser(id: string, data: AdminUpdateUserData): Promise<UserResponse> {
    const response = await this.makeRequest<UserResponse>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.data) {
      throw new Error('Failed to update user');
    }
    
    return response.data;
  }

  static async resetUserPassword(id: string, password: string): Promise<UserResponse> {
    const response = await this.makeRequest<UserResponse>(`/admin/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
    
    if (!response.data) {
      throw new Error('Failed to reset password');
    }
    
    return response.data;
  }

  static async deleteUser(id: string): Promise<void> {
    await this.makeRequest(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }
}
