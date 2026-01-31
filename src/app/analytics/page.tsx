'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  Sparkles, Bot, Loader2, AlertTriangle, XCircle, Send 
} from 'lucide-react';

// --- NEW IMPORTS FOR MARKDOWN ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AnalyticsPage() {
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [advice, setAdvice] = useState('');
  const [aiError, setAiError] = useState('');
  const [prompt, setPrompt] = useState(''); 

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      try {
        const res = await fetch('/api/analytics', { headers: { 'Authorization': `Bearer ${token}` }});
        if (res.ok) setData(await res.json());
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [router]);

  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); 
    
    // Default prompt if empty
    const messageToSend = prompt.trim() || "Analyze my finances and give me a strategy to increase my net worth.";

    setAiLoading(true);
    setAdvice('');
    setAiError('');
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageToSend }) 
      });
      const data = await res.json();
      if (res.ok) setAdvice(data.advice);
      else setAiError(data.message || "Failed to generate advice");
    } catch (err) { setAiError("Network Error. Is Ollama running?"); } 
    finally { setAiLoading(false); }
  };

  if (loading) return <Shell><div className="flex justify-center items-center h-full text-white">Loading...</div></Shell>;
  if (!data) return null;

  return (
    <Shell>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Financial Intelligence</h1>
          <p className="text-gray-400 text-sm">AI-powered insights & deep analytics</p>
        </div>

        {/* --- AI ADVISOR CARD --- */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0f1115] border border-purple-500/20 p-8 shadow-2xl">
           <div className="relative z-10">
             <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-6">
               <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                 <Bot size={28} className="text-white" />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-white">Ask FinBot</h2>
                 <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Llama 3.2 • Context Aware</p>
               </div>
             </div>

             {/* 1. INPUT AREA */}
             {!advice && !aiLoading && (
               <div className="max-w-3xl mx-auto">
                 <p className="text-gray-400 mb-4 text-sm">
                   I have access to your <span className="text-white font-bold">${data.totalIncome.toLocaleString()} income</span>, 
                   <span className="text-white font-bold"> ${data.totalExpenses.toLocaleString()} expenses</span>, and 
                   investments. Ask me anything:
                 </p>
                 
                 <form onSubmit={handleAskAI} className="relative">
                   <textarea 
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     placeholder="e.g. 'I have $12,000 in cash. How should I allocate this to maximize growth over the next 5 years?'"
                     className="w-full bg-[#1a1f2e] border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none h-32"
                   />
                   <button 
                     type="submit"
                     className="absolute bottom-4 right-4 bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-500 transition"
                   >
                     <Send size={20} />
                   </button>
                 </form>
               </div>
             )}

             {/* 2. LOADING STATE */}
             {aiLoading && (
               <div className="flex flex-col items-center justify-center py-10">
                 <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
                 <p className="text-purple-300 animate-pulse font-medium">Analyzing Portfolio Strategy...</p>
                 <p className="text-xs text-gray-500 mt-2">Correlating spending data with investment goals</p>
               </div>
             )}

             {/* 3. RESULT STATE (Using React Markdown) */}
             {advice && (
               <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-700/50 animate-fade-in relative group">
                 <div className="absolute top-4 right-4">
                    <button onClick={() => setAdvice('')} className="text-gray-500 hover:text-white transition"><XCircle size={20}/></button>
                 </div>
                 
                 {/* PROSE CONTAINER FOR MARKDOWN STYLING */}
                 <div className="pr-4 prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-purple-400 prose-li:text-gray-300 max-w-none">
                   <p className="text-xs text-purple-400 mb-4 font-bold uppercase tracking-widest">Strategy Recommendation:</p>
                   
{/* ... inside src/app/analytics/page.tsx ... */}

                   <ReactMarkdown 
                     remarkPlugins={[remarkGfm]}
                     components={{
                       // 1. Tables (The cool part)
                       table: ({node, ...props}) => <div className="overflow-x-auto my-6 border border-gray-700 rounded-xl shadow-lg"><table className="min-w-full divide-y divide-gray-800 bg-[#151921]" {...props} /></div>,
                       thead: ({node, ...props}) => <thead className="bg-purple-900/20 text-purple-100" {...props} />,
                       th: ({node, ...props}) => <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-purple-300" {...props} />,
                       td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-t border-gray-800" {...props} />,
                       
                       // 2. Headings
                       h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mt-6 mb-4" {...props} />,
                       h2: ({node, ...props}) => <h2 className="text-xl font-bold text-purple-200 mt-5 mb-3" {...props} />,
                       h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-200 mt-4 mb-2" {...props} />,

                       // 3. Lists (Fixing the "Paragraph" issue)
                       ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-300" {...props} />,
                       ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 mb-4 text-gray-300 marker:text-purple-500 marker:font-bold" {...props} />,
                       li: ({node, ...props}) => <li className="pl-1" {...props} />,
                       
                       // 4. Text
                       p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-gray-300" {...props} />,
                       strong: ({node, ...props}) => <strong className="text-white font-bold bg-white/10 px-1 rounded" {...props} />
                     }}
                   >
                     {advice}
                   </ReactMarkdown>
                 </div>
               </div>
             )}
             
             {aiError && (
               <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-3">
                 <AlertTriangle size={20} />
                 <div><p className="font-bold">Connection Error</p><p className="text-xs opacity-80">{aiError}</p></div>
               </div>
             )}
           </div>
           
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        </div>
        
        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Income" amount={data.totalIncome} color="text-green-500" icon={TrendingUp} bgColor="bg-green-500/10"/>
          <StatCard title="Total Expenses" amount={data.totalExpenses} color="text-red-500" icon={TrendingDown} bgColor="bg-red-500/10"/>
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
             <div className="flex justify-between items-start mb-2">
                <p className="text-gray-400 font-medium text-sm">Net Savings</p>
                <div className="bg-blue-500/10 p-2 rounded-lg"><DollarSign className="text-blue-500" size={20}/></div>
             </div>
             <h2 className="text-3xl font-bold text-blue-500 mb-1">${data.netSavings.toLocaleString()}</h2>
             <p className="text-gray-500 text-xs">Savings Rate: {data.savingsRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* --- CHARTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6">Income vs Expenses</h3>
            <div className="h-[200px] flex items-end justify-around gap-4">
              {data.monthlyTrends.map((month: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-2 w-full">
                     <div className="flex gap-1 h-full items-end w-full justify-center">
                        <div className="w-4 bg-green-500 rounded-t-sm" style={{ height: `${Math.min((month.income / (data.totalIncome || 1)) * 150, 100)}%` }} />
                        <div className="w-4 bg-red-500 rounded-t-sm" style={{ height: `${Math.min((month.expense / (data.totalIncome || 1)) * 150, 100)}%` }} />
                     </div>
                     <span className="text-[10px] text-gray-500">{month.month.slice(5)}</span>
                  </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
            <h3 className="w-full text-left text-white font-semibold mb-2">Spending by Category</h3>
            {data.totalExpenses > 0 ? (
              <div className="flex items-center gap-8">
                 <div className="w-40 h-40 rounded-full relative" style={{ background: `conic-gradient(${generateConicGradient(data.spendingByCategory)})` }}>
                   <div className="absolute inset-0 m-auto w-24 h-24 bg-[#1a1f2e] rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-xs font-medium">Expenses</span>
                   </div>
                 </div>
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
            ) : <div className="h-[200px] flex items-center text-gray-500">No expenses yet</div>}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// Helpers
function StatCard({ title, amount, color, icon: Icon, bgColor }: any) {
  return (
    <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6">
      <div className="flex justify-between items-start mb-2">
         <p className="text-gray-400 font-medium text-sm">{title}</p>
         <div className={`${bgColor} p-2 rounded-lg`}><Icon size={20} className={color.replace('text-', '')}/></div>
      </div>
      <h2 className={`text-3xl font-bold ${color} mb-1`}>${amount.toLocaleString()}</h2>
    </div>
  );
}
function getCategoryColor(idx: number) { return ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ef4444', '#ec4899'][idx % 6]; }
function generateConicGradient(data: any[]) {
  let gradientString = ''; let currentPercent = 0;
  data.forEach((item, idx) => {
    const end = currentPercent + item.percent;
    gradientString += `${getCategoryColor(idx)} ${currentPercent}% ${end}%, `;
    currentPercent = end;
  });
  return gradientString.slice(0, -2);
}