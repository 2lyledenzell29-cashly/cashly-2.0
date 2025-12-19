import { ApiResponse, User } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface AuthTokens {
  token: string;
  refreshToken?: string;
}

export class AuthService {
  private static TOKEN_KEY = 'wallet_app_token';
  private static REFRESH_TOKEN_KEY = 'wallet_app_refresh_token';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailOrUsername: email, password }),
    });

    const result: ApiResponse<{ user: User; token: string }> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Login failed');
    }

    this.setToken(result.data.token);
    return result.data;
  }

  static async register(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<{ user: User; token: string }> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Registration failed');
    }

    this.setToken(result.data.token);
    return result.data;
  }

  static async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse<User> = await response.json();

      if (!result.success || !result.data) {
        this.clearTokens();
        return null;
      }

      return result.data;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  static logout(): void {
    this.clearTokens();
  }
}

// Password validation utility
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Password strength calculator
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  if (score <= 2) {
    return { score, label: 'Weak', color: 'text-red-600' };
  } else if (score <= 4) {
    return { score, label: 'Medium', color: 'text-yellow-600' };
  } else {
    return { score, label: 'Strong', color: 'text-green-600' };
  }
};