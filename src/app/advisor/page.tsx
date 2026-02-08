'use client';

import { useState, useEffect } from 'react';
import Shell from '@/components/layout/Shell';
import { useCurrency } from '@/context/CurrencyContext';
import { 
    Sparkles, Brain, TrendingUp, TrendingDown, 
    Wallet, PieChart, ArrowRight, CheckCircle2, 
    Zap, Banknote, Target, Activity
} from 'lucide-react';

export default function AIAdvisorPage() {
  const { format } = useCurrency();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true); 
  const [analyzing, setAnalyzing] = useState(false); 
  const [showFullReport, setShowFullReport] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/financial-health', {
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setReport(data);
        } catch (error) {
            console.error("Failed to load initial data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const handleStartAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
        setAnalyzing(false);
        setShowFullReport(true);
    }, 2500);
  };

  if (loading) {
     return (
        <Shell>
           <div className="h-[80vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin"></div>
           </div>
        </Shell>
     );
  }

  const metrics = report?.metrics || { totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0, portfolioValue: 0 };

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center pt-2">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                   <div className="bg-purple-500/20 p-2 rounded-xl">
                      <Sparkles size={24} className="text-purple-400" />
                   </div>
                   AI Financial Advisor
                </h1>
                <p className="text-gray-400 text-sm mt-1 ml-1">Personalized insights powered by FinBank AI</p>
            </div>
            {showFullReport && (
                 <button onClick={() => { setAnalyzing(true); setTimeout(() => setAnalyzing(false), 2000); }} className="btn-analyze">
                    <Sparkles size={16} /> Re-Analyze
                </button>
            )}
        </div>

        {/* 1. METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard label="Total Balance" value={metrics.totalBalance} icon={Wallet} color="text-blue-400" bg="bg-blue-400/10" format={format} />
            <MetricCard label="Total Income" value={metrics.monthlyIncome} icon={TrendingUp} color="text-emerald-400" bg="bg-emerald-400/10" format={format} />
            <MetricCard label="Total Expenses" value={metrics.monthlyExpense} icon={TrendingDown} color="text-red-400" bg="bg-red-400/10" format={format} />
            <MetricCard label="Investments" value={metrics.portfolioValue} icon={PieChart} color="text-purple-400" bg="bg-purple-400/10" format={format} />
        </div>

        {/* 2. CONDITIONAL CONTENT */}
        {analyzing ? (
            <div className="h-[50vh] flex flex-col items-center justify-center space-y-6 advisor-card mt-8">
                <div className="relative">
                    <div className="w-20 h-20 border-t-4 border-purple-500 border-solid rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="w-8 h-8 text-purple-500 animate-pulse" />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-white">Generating Insights...</h2>
            </div>
        ) : !showFullReport ? (
            // --- LANDING VIEW ---
            <div className="mt-8 relative advisor-card min-h-[500px] flex flex-col items-center justify-center text-center p-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="mb-8 p-6 bg-[#1a1f2e] rounded-3xl border border-gray-800 shadow-2xl relative group">
                    <Sparkles className="w-12 h-12 text-purple-500 group-hover:scale-110 transition-transform" />
                </div>

                <h2 className="text-4xl font-bold text-white mb-4">Get AI-Powered Financial Insights</h2>
                <p className="text-gray-400 text-lg max-w-2xl leading-relaxed mb-10">
                    Our advanced AI will analyze your spending patterns, investment performance, and financial health to provide personalized recommendations.
                </p>

                <button onClick={handleStartAnalysis} className="btn-analyze text-lg px-8 py-4">
                    <Sparkles size={20} /> Start Analysis
                </button>
            </div>
        ) : (
            // --- FULL REPORT VIEW ---
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                
                {/* HEALTH SCORE CARD */}
                <div className="advisor-card">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">Financial Health Score</h2>
                        </div>
                        <div className="text-right">
                            <span className="text-5xl font-bold text-white tracking-tighter">{report.healthScore}</span>
                            <span className="text-gray-500 font-bold text-xl">/100</span>
                            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">Excellent</p>
                        </div>
                    </div>
                    
                    {/* Progress Bar (THE SEXY ONE) */}
                    <div className="health-progress-track mb-6">
                        <div className="health-progress-fill" style={{ width: `${report.healthScore}%` }}></div>
                    </div>

                    <p className="text-gray-300 leading-relaxed text-sm opacity-90">{report.summary}</p>
                </div>

                {/* ANALYSIS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="advisor-card">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="text-blue-400" size={20} />
                            <h3 className="text-lg font-bold text-white">Spending Analysis</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">{report.spendingAnalysis}</p>
                    </div>

                    <div className="advisor-card">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="text-emerald-400" size={20} />
                            <h3 className="text-lg font-bold text-white">Investment Strategy</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">{report.investmentStrategy}</p>
                    </div>
                </div>

                {/* SAVINGS RECOMMENDATIONS */}
                <div className="advisor-card">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Target className="text-purple-500" size={20} /> Savings Recommendations
                    </h3>
                    <div className="space-y-3">
                        {report.savingsRecommendations.map((rec: string, i: number) => (
                            <div key={i} className="rec-row">
                                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={18} />
                                <span className="text-gray-300 text-sm font-medium">{rec}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RECOMMENDED BUDGET */}
                <div className="advisor-card">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Banknote className="text-orange-500" size={20} /> Recommended Budget
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(report.recommendedBudget).map(([category, amount]: any, i) => (
                            <div key={i} className="bg-[#1a1f2e] border border-gray-800 p-4 rounded-xl">
                                <p className="text-label mb-2">{category}</p>
                                <p className="text-xl font-bold text-white">{format(amount)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ACTION PLAN */}
                <div className="advisor-card">
                     <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="text-yellow-500" size={20} /> Action Items for This Month
                    </h3>
                    <div className="space-y-3">
                        {report.actionItems.map((item: string, i: number) => (
                             <div key={i} className="flex items-center gap-4 bg-[#1a1f2e] p-3 rounded-lg border border-gray-800">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{i + 1}</div>
                                <p className="text-gray-300 text-sm">{item}</p>
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </div>
    </Shell>
  );
}

// --- SUB COMPONENTS ---

function MetricCard({ label, value, icon: Icon, color, bg, format }: any) {
    return (
        <div className="advisor-card flex items-center gap-4 p-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-label">{label}</p>
                <p className="text-value text-xl">{format(value)}</p>
            </div>
        </div>
    );
}