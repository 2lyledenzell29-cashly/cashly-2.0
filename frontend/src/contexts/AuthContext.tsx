import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType, RegisterForm } from '@/types';
import { AuthService } from '@/utils/auth';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const { user: loggedInUser } = await AuthService.login(email, password);
      setUser(loggedInUser);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterForm): Promise<void> => {
    try {
      setLoading(true);
      const { user: registeredUser } = await AuthService.register(data);
      setUser(registeredUser);
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    AuthService.logout();
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};