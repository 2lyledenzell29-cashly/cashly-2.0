import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  currentPage?: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Wallets', path: '/wallets' },
    { name: 'Family Wallets', path: '/family-wallets' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Categories', path: '/categories' },
    { name: 'Budgets', path: '/budgets' },
    { name: 'Reminders', path: '/reminders' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-semibold text-gray-900">Wallet App</h1>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => {
                const isActive = currentPage === item.name || router.pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={
                      isActive
                        ? "text-blue-600 px-3 py-2 text-sm font-medium border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                    }
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Welcome, {user?.username}</span>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;