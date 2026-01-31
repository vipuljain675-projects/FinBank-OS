// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  LineChart, 
  ArrowRightLeft, 
  CreditCard, 
  BarChart3, 
  LogOut 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Investments', href: '/investments', icon: LineChart },
  { name: 'Transactions', href: '/transactions', icon: ArrowRightLeft },
  { name: 'Cards', href: '/cards', icon: CreditCard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token
    router.push('/login'); // Redirect to login
  };

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '6px' }}>
          <Wallet color="white" size={24} />
        </div>
        <span>FinBank</span>
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div onClick={handleLogout} className="nav-item" style={{ marginTop: 'auto', color: 'var(--danger)' }}>
        <LogOut size={20} />
        <span>Logout</span>
      </div>
    </aside>
  );
}