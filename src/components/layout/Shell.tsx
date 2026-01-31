// src/components/layout/Shell.tsx
'use client';

import Sidebar from './Sidebar'; // Ensure this path matches your Sidebar component
import { usePathname } from 'next/navigation';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Helper to get a clean title based on the current page
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname === '/accounts') return 'Accounts';
    if (pathname === '/transactions') return 'Transactions';
    if (pathname === '/investments') return 'Investments';
    if (pathname === '/cards') return 'Cards';
    if (pathname === '/analytics') return 'Analytics';
    return 'FinBank';
  };

  return (
    <div className="app-shell">
      {/* 1. Fixed Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="main-content">
        
        {/* Top Header - Cleaned up (No Search/Bell/Profile) */}
        <div className="topbar">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {getPageTitle()}
          </h2>
          {/* Right side removed as requested */}
        </div>

        {/* Scrollable Content */}
        <div className="scrollable-area">
          <div className="content-container">
            {children}
          </div>
        </div>
        
      </div>
    </div>
  );
}