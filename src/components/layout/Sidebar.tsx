'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Wallet, LineChart, 
  ArrowRightLeft, PieChart, CreditCard, 
  Bot, Sparkles, LogOut 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Investments', href: '/investments', icon: LineChart },
    { name: 'Transactions', href: '/transactions', icon: ArrowRightLeft },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
    { name: 'Cards', href: '/cards', icon: CreditCard },
    // 👇 NEW: Added the AI Advisor Link here
    { name: 'AI Advisor', href: '/advisor', icon: Sparkles },
    { name: 'FinBot Chat', href: '/finbot', icon: Bot }, 
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-gray-800 h-screen fixed left-0 top-0 flex flex-col p-6 z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Wallet className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">FinBank</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-purple-400 transition-colors'} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 pt-6">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}