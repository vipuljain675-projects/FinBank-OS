'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, CreditCard, PieChart, TrendingUp, 
  LogOut, Menu, Wallet, Settings, Globe, BarChart3,
  Sparkles // 👈 Added Sparkles Import
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext'; 

export default function Shell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const { currency, setCurrency } = useCurrency(); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Investments', href: '/investments', icon: TrendingUp },
    { name: 'Transactions', href: '/transactions', icon: PieChart },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Cards', href: '/cards', icon: CreditCard },
    // 👇 Added AI Advisor
    { name: 'AI Advisor', href: '/advisor', icon: Sparkles },
    { name: 'FinBot AI', href: '/finbot', icon: Settings },
  ];

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname === '/accounts') return 'Accounts';
    if (pathname === '/transactions') return 'Transactions';
    if (pathname === '/investments') return 'Investments';
    if (pathname === '/analytics') return 'Analytics';
    if (pathname === '/cards') return 'Cards';
    if (pathname === '/advisor') return 'AI Advisor'; // 👈 Added Title Logic
    return 'FinBank';
  };

  return (
    // 1. ROOT CONTAINER: Fixed height (100vh), no scroll on body
    <div className="flex h-screen w-full bg-[#0f1115] text-white font-sans overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR - Fixed width, stays on left */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#161b22] border-r border-gray-800 flex flex-col transition-transform duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">FinBank</span>
        </div>

        {/* Nav Items (Scrollable if menu is long) */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer (Currency & Logout) */}
        <div className="p-4 border-t border-gray-800 shrink-0 bg-[#161b22]">
           <div className="bg-[#0f1115] p-3 rounded-xl border border-gray-800 mb-3">
              <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 flex items-center gap-1">
                 <Globe size={10} /> Currency
              </label>
              <div className="flex gap-2">
                 {['INR', 'USD', 'EUR'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c as any)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                         currency === c 
                         ? 'bg-indigo-600 text-white' 
                         : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                 ))}
              </div>
           </div>

           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
           >
             <LogOut size={20} />
             <span className="font-medium text-sm">Logout</span>
           </button>
        </div>
      </aside>

      {/* 2. RIGHT SIDE CONTAINER */}
      {/* Takes remaining width (flex-1) and handles vertical layout */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f1115]">
        
        {/* Mobile Header (Sticky) */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-[#161b22] sticky top-0 z-30 shrink-0">
          <span className="font-bold text-white">{getPageTitle()}</span>
          <button onClick={() => setIsMobileOpen(true)} className="text-gray-400">
            <Menu size={24} />
          </button>
        </div>

        {/* 3. MAIN SCROLLABLE AREA */}
        {/* 'overflow-y-auto' MUST be here to scroll just the content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-24">
             {children}
          </div>
        </main>
      </div>

    </div>
  );
}