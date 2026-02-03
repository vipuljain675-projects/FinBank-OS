'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Shell from '@/components/layout/Shell';
import SpendingBarChart from '@/components/charts/SpendingBarChart';
import { 
  Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, 
  CreditCard, Plus, Send, Download, Loader2 
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      try {
        const res = await fetch('/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) return (
    <Shell>
      <div className="flex items-center justify-center h-full text-white">
        <Loader2 className="animate-spin mr-2" /> Loading Dashboard...
      </div>
    </Shell>
  );

  if (!data) return null;

  // Prepare chart data
  let chartData: any[] = [];
  if (data.chartData && data.chartData.length > 0) {
    chartData = data.chartData.map((item: any) => ({
      name: item.label,
      value: Math.abs(item.value),
      color: item.color
    }));
  } else if (data.recentTransactions) {
    const expenses = data.recentTransactions.filter((t: any) => t.type === 'expense');
    const grouped = expenses.reduce((acc: any, curr: any) => {
      const key = curr.category || 'Other';
      if (!acc[key]) acc[key] = 0;
      acc[key] += Math.abs(curr.amount);
      return acc;
    }, {});
    chartData = Object.keys(grouped).map((key, index) => ({
      name: key,
      value: grouped[key],
      color: ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ef4444', '#ec4899'][index % 6]
    }));
  }

  return (
    <Shell>
      <div className="space-y-8 pb-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm">Here's your financial overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Balance" 
            value={format(data.totalBalance)} 
            icon={Wallet} 
            color="text-blue-400"
            bgColor="bg-blue-500/10"
            trend="+12.5%"
          />
          <StatCard 
            title="Portfolio Value" 
            value={format(data.portfolioValue)} 
            icon={TrendingUp} 
            color="text-green-500"
            bgColor="bg-green-500/10"
            trend="+8.2%"
          />
          <StatCard 
            title="Monthly Income" 
            value={format(data.monthlyIncome)} 
            icon={ArrowDownLeft} 
            color="text-blue-400"
            bgColor="bg-blue-500/10"
            trend="+5.1%"
          />
          <StatCard 
            title="Monthly Expenses" 
            value={format(Math.abs(data.monthlyExpenses))} 
            icon={ArrowUpRight} 
            color="text-red-400"
            bgColor="bg-red-500/10"
            trend="-3.4%"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction href="/transactions" icon={Send} label="Send Money" color="bg-purple-600" />
            <QuickAction href="/transactions" icon={Download} label="Request" color="bg-green-500" />
            <QuickAction href="/cards" icon={CreditCard} label="Cards" color="bg-blue-500" />
            <QuickAction href="/accounts" icon={Plus} label="Add Account" color="bg-orange-500" />
          </div>
        </div>

        {/* Accounts Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Your Accounts</h3>
            <Link href="/accounts" className="text-sm text-purple-400 hover:text-purple-300">
              Manage
            </Link>
          </div>
           
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.accounts && data.accounts.length > 0 ? (
              data.accounts.map((acc: any) => (
                <AccountCard key={acc._id} account={acc} format={format} />
              ))
            ) : (
              <div className="col-span-full text-center py-10 border border-gray-800 border-dashed rounded-xl text-gray-500">
                No accounts linked yet.
              </div>
            )}
          </div>
        </div>

        {/* Main Grid: Transactions & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Transactions */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
              <Link href="/transactions" className="text-sm text-purple-400 hover:text-purple-300">
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {data.recentTransactions && data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx: any) => (
                  <div 
                    key={tx._id} 
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#1f2937] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}>
                        {tx.logo ? (
                          <img src={tx.logo} alt="logo" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          tx.type === 'income' ? 
                            <ArrowDownLeft size={18} className="text-green-500" /> : 
                            <ArrowUpRight size={18} className="text-red-500" />
                        )}
                      </div>
                      
                      <div>
                        <p className="text-white font-medium text-sm">{tx.name}</p>
                        <p className="text-xs text-gray-500">
                          {tx.category || 'Other'} • {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`font-bold text-sm ${
                      tx.type === 'income' ? 'text-green-500' : 'text-red-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{format(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No transactions yet.
                </div>
              )}
            </div>
          </div>

          {/* Spending Chart */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Spending by Category</h3>
            <div style={{ height: '320px', width: '100%' }}>
              <SpendingBarChart data={chartData} />
            </div>
          </div>

        </div>
      </div>
    </Shell>
  );
}

// --- SUBCOMPONENTS ---

function StatCard({ title, value, icon: Icon, color, bgColor, trend }: any) {
  const isPositive = trend?.startsWith('+');
  
  return (
    <div className="bg-[#1a1f2e] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon size={24} className={color} />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${
            isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: any) {
  return (
    <Link 
      href={href} 
      className={`${color} hover:opacity-90 transition p-6 rounded-xl flex flex-col items-center justify-center gap-3 border border-white/5 hover:border-white/10`}
    >
      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
        <Icon size={24} className="text-white" />
      </div>
      <span className="text-white text-sm font-medium">{label}</span>
    </Link>
  );
}

function AccountCard({ account, format }: any) {
  const getAccountIcon = (type: string) => {
    const icons: any = {
      'investment': { color: 'bg-pink-500/10 text-pink-500', label: 'Investment' },
      'checking': { color: 'bg-blue-500/10 text-blue-500', label: 'Checking' },
      'crypto': { color: 'bg-orange-500/10 text-orange-500', label: 'Crypto' },
      'savings': { color: 'bg-green-500/10 text-green-500', label: 'Savings' }
    };
    // Safe toLowerCase with fallback
    const typeKey = type ? type.toLowerCase() : 'checking';
    return icons[typeKey] || icons['checking'];
  };

  const iconConfig = getAccountIcon(account.type || 'checking');

  return (
    <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition group cursor-pointer">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-xl ${iconConfig.color}`}>
          <Wallet size={24} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
          {iconConfig.label}
        </span>
      </div>
      <div>
        <h4 className="text-gray-400 font-medium text-sm mb-1">{account.name}</h4>
        <h2 className="text-2xl font-bold text-white mb-1">{format(account.balance)}</h2>
        <p className="text-xs text-gray-600 font-mono">**** {account._id.slice(-4)}</p>
      </div>
    </div>
  );
}