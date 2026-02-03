'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { useCurrency } from '@/context/CurrencyContext'; 
import { 
  TrendingUp, TrendingDown, DollarSign, Loader2 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, Tooltip 
} from 'recharts';

export default function AnalyticsPage() {
  const router = useRouter();
  const { format } = useCurrency();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      try {
        const res = await fetch('/api/analytics', { headers: { 'Authorization': `Bearer ${token}` }});
        if (res.ok) setData(await res.json());
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchAnalytics();
  }, [router]);

  if (loading) return <Shell><div className="flex justify-center items-center h-full text-white"><Loader2 className="animate-spin mr-2"/> Loading Analytics...</div></Shell>;
  if (!data) return null;

  return (
    <Shell>
      <div className="space-y-6 pb-20">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-gray-400 text-sm">Insights into your financial health</p>
        </div>

        {/* --- 1. TOP STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1f2e] border border-gray-800 p-6 rounded-2xl relative overflow-hidden">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl"><TrendingUp className="text-green-500" size={24}/></div>
                <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">+100%</span>
             </div>
             <p className="text-gray-400 text-sm">Total Income</p>
             <h3 className="text-3xl font-bold text-white mt-1">{format(data.totalIncome)}</h3>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800 p-6 rounded-2xl relative overflow-hidden">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl"><TrendingDown className="text-red-500" size={24}/></div>
             </div>
             <p className="text-gray-400 text-sm">Total Expenses</p>
             <h3 className="text-3xl font-bold text-white mt-1">{format(data.totalExpenses)}</h3>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800 p-6 rounded-2xl relative overflow-hidden">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl"><DollarSign className="text-blue-500" size={24}/></div>
             </div>
             <p className="text-gray-400 text-sm">Net Savings</p>
             <h3 className="text-3xl font-bold text-blue-400 mt-1">{format(data.netSavings)}</h3>
             <p className="text-xs text-gray-500 mt-2">Savings Rate: {data.savingsRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* --- 2. CHARTS ROW --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 📈 LINE CHART */}
            <div className="bg-[#1a1f2e] border border-gray-800 p-6 rounded-2xl">
                <h3 className="text-white font-bold mb-6">Income vs Expenses</h3>
                
                <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#9ca3af" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis 
                                stroke="#9ca3af" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} 
                            />
                            <RechartsTooltip 
                                contentStyle={{ 
                                    backgroundColor: '#1f2937', 
                                    border: '1px solid #374151', 
                                    borderRadius: '8px', 
                                    color: '#fff',
                                    fontSize: '14px'
                                }}
                                itemStyle={{ color: '#fff' }}
                                // 🛡️ FIX 1: Use (value: any) to satisfy TypeScript
                                formatter={(value: any) => [format(Number(value)), 'Amount']}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="income" 
                                stroke="#10b981" 
                                strokeWidth={3} 
                                dot={false} 
                                activeDot={{ r: 6 }} 
                                name="Income" 
                            />
                            <Line 
                                type="monotone" 
                                dataKey="expense" 
                                stroke="#ef4444" 
                                strokeWidth={3} 
                                dot={false} 
                                activeDot={{ r: 6 }} 
                                name="Expenses" 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 🍩 PIE CHART */}
            <div className="bg-[#1a1f2e] border border-gray-800 p-6 rounded-2xl">
                <h3 className="text-white font-bold mb-6">Spending by Category</h3>
                
                <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.spendingByCategory}
                                cx="50%"
                                cy="45%" 
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.spendingByCategory.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            {/* 🛡️ FIX 2: Use (value: any) here too */}
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#1f2937', 
                                    border: '1px solid #374151', 
                                    borderRadius: '8px', 
                                    color: '#fff',
                                    fontSize: '14px'
                                }}
                                formatter={(value: any) => format(Number(value))}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={40} 
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px' }}
                                formatter={(value, entry: any) => {
                                    const percentage = ((entry.payload.value / data.totalExpenses) * 100).toFixed(0);
                                    return `${value} ${percentage}%`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* --- 3. TOP SPENDING LIST --- */}
        <div className="bg-[#1a1f2e] border border-gray-800 p-6 rounded-2xl">
            <h3 className="text-white font-bold mb-6">Top Spending Categories</h3>
            <div className="space-y-6">
                {data.spendingByCategory && data.spendingByCategory.length > 0 ? (
                    data.spendingByCategory.map((cat: any, index: number) => {
                        const percentage = ((cat.value / data.totalExpenses) * 100);
                        return (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 font-mono text-xs">#{index + 1}</span>
                                        <span className="text-white font-medium">{cat.name}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-white font-bold">{format(cat.value)}</span>
                                        <span className="text-gray-500 text-xs w-12 text-right">
                                            {percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="h-2 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ 
                                            width: `${percentage}%`, 
                                            backgroundColor: cat.color 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-gray-500 py-10">No expenses recorded yet.</div>
                )}
            </div>
        </div>

      </div>
    </Shell>
  );
}