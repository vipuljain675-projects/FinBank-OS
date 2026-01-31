// src/app/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      try {
        const res = await fetch('/api/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const jsonData = await res.json();
          setData(jsonData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) return (
    <Shell>
      <div className="flex items-center justify-center h-full text-white">Calculating Analytics...</div>
    </Shell>
  );

  if (!data) return null;

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-gray-400 text-sm">Insights into your financial health</p>
        </div>

        {/* 1. TOP CARDS (Income, Expense, Savings) */}
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
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
             <div className="flex justify-between items-start mb-2">
                <p className="text-gray-400 font-medium text-sm">Net Savings</p>
                <div className="bg-blue-500/10 p-2 rounded-lg"><DollarSign className="text-blue-500" size={20}/></div>
             </div>
             <h2 className="text-3xl font-bold text-blue-500 mb-1">
               ${data.netSavings.toLocaleString()}
             </h2>
             <p className="text-gray-500 text-xs">Savings Rate: {data.savingsRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* 2. CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Income vs Expenses Chart (Simple Visualization) */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6">Income vs Expenses</h3>
            <div className="h-[200px] flex items-end justify-around gap-4">
              {data.monthlyTrends.length > 0 ? (
                data.monthlyTrends.map((month: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-2 w-full">
                     <div className="flex gap-1 h-full items-end w-full justify-center">
                        {/* Income Bar */}
                        <div 
                          className="w-4 bg-green-500 rounded-t-sm hover:opacity-80 transition-all"
                          style={{ height: `${Math.min((month.income / (data.totalIncome || 1)) * 150, 100)}%` }} 
                        />
                        {/* Expense Bar */}
                        <div 
                          className="w-4 bg-red-500 rounded-t-sm hover:opacity-80 transition-all"
                          style={{ height: `${Math.min((month.expense / (data.totalIncome || 1)) * 150, 100)}%` }} 
                        />
                     </div>
                     <span className="text-[10px] text-gray-500">{month.month.slice(5)}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm flex items-center justify-center h-full w-full">
                  Not enough data for timeline
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-4">
               <div className="flex items-center gap-2 text-xs text-gray-400"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Income</div>
               <div className="flex items-center gap-2 text-xs text-gray-400"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Expenses</div>
            </div>
          </div>

          {/* Spending Pie Chart */}
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
            <h3 className="w-full text-left text-white font-semibold mb-2">Spending by Category</h3>
            
            {data.totalExpenses > 0 ? (
              <div className="flex items-center gap-8">
                 {/* CSS Conic Gradient Pie Chart */}
                 <div 
                   className="w-40 h-40 rounded-full relative"
                   style={{
                     background: `conic-gradient(
                       ${generateConicGradient(data.spendingByCategory)}
                     )`
                   }}
                 >
                   {/* Center Hole for Donut Effect */}
                   <div className="absolute inset-0 m-auto w-24 h-24 bg-[#1a1f2e] rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xs font-medium">Expenses</span>
                   </div>
                 </div>

                 {/* Legend */}
                 <div className="space-y-2">
                   {data.spendingByCategory.slice(0, 5).map((cat: any, idx: number) => (
                     <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(idx) }}></span>
                        <span className="text-gray-300 w-20 truncate">{cat.name}</span>
                        <span className="text-white font-bold">{cat.percent.toFixed(0)}%</span>
                     </div>
                   ))}
                 </div>
              </div>
            ) : (
               <div className="h-[200px] flex items-center text-gray-500">No expenses yet</div>
            )}
          </div>
        </div>

        {/* 3. TOP CATEGORIES BARS */}
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-6">Top Spending Categories</h3>
          <div className="space-y-4">
            {data.spendingByCategory.map((cat: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{cat.name}</span>
                  <span className="text-gray-400">${cat.value.toLocaleString()} ({cat.percent.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${cat.percent}%`,
                      backgroundColor: getCategoryColor(idx)
                    }}
                  />
                </div>
              </div>
            ))}
             {data.spendingByCategory.length === 0 && (
               <div className="text-gray-500 text-sm">No spending data available.</div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// --- SUBCOMPONENTS & HELPERS ---

function StatCard({ title, amount, color, icon: Icon, bgColor }: any) {
  return (
    <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
      <div className="flex justify-between items-start mb-2">
         <p className="text-gray-400 font-medium text-sm">{title}</p>
         <div className={`${bgColor} p-2 rounded-lg`}><Icon size={20} className={color.replace('text-', '')}/></div>
      </div>
      <h2 className={`text-3xl font-bold ${color} mb-1`}>
        ${amount.toLocaleString()}
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
  
  data.forEach((item, idx) => {
    const color = getCategoryColor(idx);
    const start = currentPercent;
    const end = currentPercent + item.percent;
    gradientString += `${color} ${start}% ${end}%, `;
    currentPercent = end;
  });

  return gradientString.slice(0, -2); // Remove trailing comma
}