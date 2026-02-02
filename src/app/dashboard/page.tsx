'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Shell from '@/components/layout/Shell';
import SpendingChart from '@/components/charts/SpendingPie'; // Ensure this exists!
import { 
  Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, 
  CreditCard, Plus, Send, Download, Loader2 
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext'; // 🌍 Import Currency Hook

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 🌍 Get the formatter
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
    <Shell><div className="flex items-center justify-center h-full text-white"><Loader2 className="animate-spin mr-2" /> Loading Dashboard...</div></Shell>
  );

  if (!data) return null;

  // --- 📊 CHART CALCULATION LOGIC ---
// ... inside Dashboard() ...

  // --- 📊 CHART CALCULATION LOGIC ---
  let chartData: any[] = [];

  // Plan A: Use API data if available
  if (data.chartData && data.chartData.length > 0) {
    chartData = data.chartData.map((item: any) => ({
      name: item.label,
      value: item.value, // ✅ Correct
      color: item.color
    }));
  } 
  
  // Plan B: Auto-calculate from Recent Transactions
  if (chartData.length === 0 && data.recentTransactions) {
    const expenses = data.recentTransactions.filter((t: any) => t.type === 'expense');
    
    // Group expenses by Category
    const grouped = expenses.reduce((acc: any, curr: any) => {
      const key = curr.category || curr.name || 'Other';
      if (!acc[key]) acc[key] = 0;
      acc[key] += Math.abs(curr.amount); 
      return acc;
    }, {});

    // 👇 THIS WAS THE ISSUE
    chartData = Object.keys(grouped).map((key, index) => ({
      name: key,
      value: grouped[key], // ✅ FIXED: Changed 'amount' to 'value'
      color: ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ef4444', '#ec4899'][index % 6]
    }));
  }
  
  return (
    <Shell>
      <div className="space-y-8 pb-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Overview</h1>
          <p className="text-gray-400 text-sm">Here's your financial summary</p>
        </div>

        {/* --- 1. TOP STATS CARDS (Using format()) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Balance" value={format(data.totalBalance)} icon={Wallet} color="text-white" bgColor="bg-blue-600"/>
          <StatCard title="Portfolio Value" value={format(data.portfolioValue)} icon={TrendingUp} color="text-green-500" bgColor="bg-green-500/10"/>
          <StatCard title="Monthly Income" value={format(data.monthlyIncome)} icon={ArrowDownLeft} color="text-blue-400" bgColor="bg-blue-500/10"/>
          <StatCard title="Monthly Expenses" value={format(data.monthlyExpenses)} icon={ArrowUpRight} color="text-red-400" bgColor="bg-red-500/10"/>
        </div>

        {/* --- 2. QUICK ACTIONS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction href="/transactions" icon={Send} label="Send Money" color="bg-purple-600" />
          <QuickAction href="/transactions" icon={Download} label="Request" color="bg-gray-800" />
          <QuickAction href="/cards" icon={CreditCard} label="Cards" color="bg-gray-800" />
          <QuickAction href="/accounts" icon={Plus} label="Add Account" color="bg-gray-800" />
        </div>

        {/* --- 3. ACCOUNTS GRID (Using format()) --- */}
        <div>
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Your Accounts</h3>
              <Link href="/accounts" className="text-sm text-purple-400 hover:text-purple-300">Manage</Link>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.accounts && data.accounts.length > 0 ? (
                data.accounts.map((acc: any) => (
                  <div key={acc._id} className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition group relative">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-xl ${
                           acc.type === 'crypto' ? 'bg-orange-500/10 text-orange-500' :
                           acc.type === 'investment' ? 'bg-purple-500/10 text-purple-500' :
                           'bg-blue-500/10 text-blue-500'
                        }`}>
                           <Wallet size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                           {acc.type}
                        </span>
                     </div>
                     <div>
                        <h4 className="text-gray-400 font-medium text-sm mb-1">{acc.name}</h4>
                        <h2 className="text-2xl font-bold text-white mb-1">
                           {format(acc.balance)} {/* 🌍 */}
                        </h2>
                        <p className="text-xs text-gray-600 font-mono">**** {acc._id.slice(-4)}</p>
                     </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10 border border-gray-800 border-dashed rounded-xl text-gray-500">
                   No accounts linked yet.
                </div>
              )}
           </div>
        </div>

        {/* --- 4. MAIN GRID (Transactions & Chart) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Transactions List (Using format()) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <div className="space-y-3">
              {data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx: any) => (
                  <div key={tx._id} className="bg-[#1a1f2e] border border-gray-800 p-4 rounded-xl flex items-center justify-between hover:bg-[#1f2937] transition">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{tx.name}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{format(Math.abs(tx.amount))} {/* 🌍 */}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-[#1a1f2e] rounded-xl border border-gray-800 border-dashed text-gray-500">No transactions yet.</div>
              )}
            </div>
          </div>

          {/* --- SPENDING CHART --- */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Spending by Category</h3>
            </div>
            
            <div className="h-[300px] w-full">
               {/* Pass data to the graph component */}
               <SpendingChart data={chartData} />
            </div>
          </div>

        </div>
      </div>
    </Shell>
  );
}

// --- SUBCOMPONENTS ---
function StatCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-[#1a1f2e] border border-gray-800 p-6 rounded-2xl flex flex-col justify-between h-[140px]">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${bgColor === 'bg-blue-600' ? 'bg-blue-600' : 'bg-[#111827]'}`}>
          <Icon size={24} className={bgColor === 'bg-blue-600' ? 'text-white' : color} />
        </div>
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
    <Link href={href} className={`${color} hover:opacity-90 transition p-4 rounded-xl flex flex-col items-center justify-center gap-2 h-28 border border-white/5`}>
      <Icon size={24} className="text-white" />
      <span className="text-white text-sm font-medium">{label}</span>
    </Link>
  );
}