import React from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} />
      
      {/* Main content with proper spacing for sidebar and mobile top bar */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;