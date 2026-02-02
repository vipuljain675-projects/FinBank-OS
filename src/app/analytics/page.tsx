'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { useCurrency } from '@/context/CurrencyContext'; // 🌍 Import Currency Hook
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Loader2,
  Wallet
} from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 🌍 Get the formatter
  const { format } = useCurrency();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { 
        router.push('/login'); 
        return; 
      }
      try {
        const res = await fetch('/api/analytics', { 
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) { 
        console.error("Failed to load analytics:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <Shell>
        <div className="flex justify-center items-center h-full text-white">
          <Loader2 className="animate-spin mr-2" /> Loading Analytics...
        </div>
      </Shell>
    );
  }

  if (!data) return null;

  return (
    <Shell>
      <div className="space-y-8 max-w-6xl mx-auto">
        
        {/* --- PAGE HEADER --- */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Financial Intelligence</h1>
          <p className="text-gray-400 text-sm">Deep dive into your income, expenses, and savings trends.</p>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Income" 
            amount={data.totalIncome} 
            color="text-green-500" 
            icon={TrendingUp} 
            bgColor="bg-green-500/10"
          />
          <StatCard 
            title="Total Expenses" 
            amount={data.totalExpenses} 
            color="text-red-500" 
            icon={TrendingDown} 
            bgColor="bg-red-500/10"
          />
          
          {/* Net Savings Card */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
             <div className="flex justify-between items-start mb-2">
                <p className="text-gray-400 font-medium text-sm">Net Savings</p>
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Wallet className="text-blue-500" size={20}/>
                </div>
             </div>
             <h2 className="text-3xl font-bold text-blue-500 mb-1">
               {/* 🌍 Dynamic Currency */}
               {format(data.netSavings)}
             </h2>
             <p className="text-gray-500 text-xs">
               Savings Rate: <span className="text-white font-bold">{data.savingsRate?.toFixed(1)}%</span>
             </p>
          </div>
        </div>

        {/* --- CHARTS GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Income vs Expenses (Bar) */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6">Monthly Trends</h3>
            <div className="h-[250px] flex items-end justify-around gap-4 border-b border-gray-800 pb-2">
              {data.monthlyTrends && data.monthlyTrends.map((month: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-2 w-full h-full justify-end">
                     <div className="flex gap-2 h-full items-end w-full justify-center">
                        {/* Income Bar */}
                        <div 
                          className="w-3 bg-green-500 rounded-t-sm transition-all duration-500 hover:bg-green-400" 
                          style={{ height: `${Math.min((month.income / (data.totalIncome || 1)) * 200, 100)}%` }} 
                        />
                        {/* Expense Bar */}
                        <div 
                          className="w-3 bg-red-500 rounded-t-sm transition-all duration-500 hover:bg-red-400" 
                          style={{ height: `${Math.min((month.expense / (data.totalIncome || 1)) * 200, 100)}%` }} 
                        />
                     </div>
                     <span className="text-[10px] text-gray-500 uppercase font-mono">{month.month.slice(0, 3)}</span>
                  </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div> Income
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div> Expenses
              </div>
            </div>
          </div>

          {/* Chart 2: Spending Categories (Donut) */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center relative">
            <h3 className="w-full text-left text-white font-semibold mb-8">Spending Breakdown</h3>
            
            {data.totalExpenses > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-8">
                 {/* CSS Conic Gradient Donut Chart */}
                 <div className="relative">
                   <div 
                     className="w-48 h-48 rounded-full" 
                     style={{ 
                       background: `conic-gradient(${generateConicGradient(data.spendingByCategory)})`,
                       boxShadow: '0 0 30px rgba(0,0,0,0.3)'
                     }}
                   ></div>
                   {/* Inner Hole */}
                   <div className="absolute inset-0 m-auto w-32 h-32 bg-[#1a1f2e] rounded-full flex flex-col items-center justify-center shadow-inner">
                      <span className="text-gray-400 text-xs font-medium uppercase tracking-widest">Total</span>
                      {/* 🌍 Dynamic Currency */}
                      <span className="text-white font-bold text-lg">{format(data.totalExpenses)}</span>
                   </div>
                 </div>

                 {/* Legend */}
                 <div className="space-y-3">
                   {data.spendingByCategory.slice(0, 5).map((cat: any, idx: number) => (
                     <div key={idx} className="flex items-center gap-3 text-sm">
                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: getCategoryColor(idx) }}></span>
                        <span className="text-gray-300 w-24 truncate">{cat.name}</span>
                        <span className="text-white font-mono font-bold">{cat.percent.toFixed(0)}%</span>
                     </div>
                   ))}
                 </div>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
                <p>No expense data found.</p>
                <p className="text-xs mt-2">Add transactions to see breakdown.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </Shell>
  );
}

// --- HELPERS ---

function StatCard({ title, amount, color, icon: Icon, bgColor }: any) {
  const { format } = useCurrency(); // 🌍 Use Hook inside Subcomponent
  
  return (
    <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
      <div className="flex justify-between items-start mb-2">
         <p className="text-gray-400 font-medium text-sm">{title}</p>
         <div className={`${bgColor} p-2 rounded-lg`}>
           <Icon size={20} className={color.replace('text-', '')}/>
         </div>
      </div>
      <h2 className={`text-3xl font-bold ${color} mb-1`}>
        {/* 🌍 Format the amount */}
        {format(amount || 0)}
      </h2>
    </div>
  );
}

function getCategoryColor(idx: number) { 
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ef4444', '#ec4899'];
  return colors[idx % colors.length]; 
}

function generateConicGradient(data: any[]) {
  let gradientString = ''; 
  let currentPercent = 0;
  
  if (!data) return '#334155 0% 100%'; 

  data.forEach((item, idx) => {
    const end = currentPercent + item.percent;
    gradientString += `${getCategoryColor(idx)} ${currentPercent}% ${end}%, `;
    currentPercent = end;
  });
  
  return gradientString.slice(0, -2);
}