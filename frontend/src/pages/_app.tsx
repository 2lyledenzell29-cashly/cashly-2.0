import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { BudgetProvider } from '@/contexts/BudgetContext';
import { ReminderProvider } from '@/contexts/ReminderContext';
import { FamilyWalletProvider } from '@/contexts/FamilyWalletContext';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <WalletProvider>
        <FamilyWalletProvider>
          <CategoryProvider>
            <TransactionProvider>
              <BudgetProvider>
                <ReminderProvider>
                  <Component {...pageProps} />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#4ade80',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
                </ReminderProvider>
              </BudgetProvider>
            </TransactionProvider>
          </CategoryProvider>
        </FamilyWalletProvider>
      </WalletProvider>
    </AuthProvider>
  );
}