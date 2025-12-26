import { ApiResponse, Wallet } from '@/types';
import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateWalletData {
  name: string;
}

export interface UpdateWalletData {
  name: string;
}

export class WalletService {
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

    let result: ApiResponse<T>;

    try {
      result = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, create a generic error response
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }
      throw new Error('Invalid response format');
    }

    if (!response.ok) {
      const errorMessage = result?.error?.message || `Request failed with status ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return result;
  }

  static async getWallets(): Promise<Wallet[]> {
    const response = await this.makeRequest<Wallet[]>('/wallets');
    return response.data || [];
  }

  static async createWallet(data: CreateWalletData): Promise<Wallet> {
    const response = await this.makeRequest<Wallet>('/wallets', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.data) {
      throw new Error('Failed to create wallet');
    }

    return response.data;
  }

  static async updateWallet(id: string, data: UpdateWalletData): Promise<Wallet> {
    const response = await this.makeRequest<Wallet>(`/wallets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.data) {
      throw new Error('Failed to update wallet');
    }

    return response.data;
  }

  static async deleteWallet(id: string): Promise<void> {
    await this.makeRequest(`/wallets/${id}`, {
      method: 'DELETE',
    });
  }

  static async setDefaultWallet(id: string): Promise<Wallet> {
    const response = await this.makeRequest<Wallet>(`/wallets/${id}/set-default`, {
      method: 'PUT',
    });

    if (!response.data) {
      throw new Error('Failed to set default wallet');
    }

    return response.data;
  }
}