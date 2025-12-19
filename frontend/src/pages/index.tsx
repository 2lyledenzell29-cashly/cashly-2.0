import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Wallet App v2.0</title>
        <meta name="description" content="Personal Finance Management Application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Wallet App v2.0
            </h1>
            <p className="text-lg text-gray-600">
              Personal Finance Management
            </p>
            <div className="mt-8 space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Welcome to Wallet App
                </h2>
                <p className="text-gray-600">
                  Manage your finances with multiple wallets, custom categories, 
                  budgets, and family sharing features.
                </p>
              </div>
              <div className="flex space-x-4">
                <button className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors">
                  Login
                </button>
                <button className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}