import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Image from 'next/image';
import { Wallet, CheckCircle } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/transactions');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Cashly 2.0</title>
        <meta name="description" content="Personal Finance Management Application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-10 h-10 text-white" />
            <h1 className="text-2xl font-bold text-white">Cashly</h1>
          </div>
        </div>

        {/* Left Branding */}
        <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="text-center text-white px-12">
            <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Cashly 2.0</h1>
            <p className="text-lg text-blue-100 mb-8">Personal Finance Management</p>

            <div className="space-y-3 text-blue-100 text-sm">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Manage multiple wallets
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Track budgets and categories
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Family sharing features
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Cashly</h2>
              <p className="text-gray-600 mb-6">
                Manage your finances with ease. Track your expenses, budgets, and wallets in one place.
              </p>

              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <Link
                  href="/auth/login"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-center"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
