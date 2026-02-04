'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { useCurrency } from '@/context/CurrencyContext'; 
import { 
  TrendingUp, TrendingDown, Plus, X, RefreshCw, Loader2, DollarSign, AlertCircle
} from 'lucide-react';

export default function InvestmentsPage() {
  const router = useRouter();
  const [investments, setInvestments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { format, currency } = useCurrency();

  // BUY Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  
  // SELL Modal
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellData, setSellData] = useState<any>(null);
  const [sellQuantity, setSellQuantity] = useState('');
  const [depositAccountId, setDepositAccountId] = useState('');

  const [formData, setFormData] = useState({
    symbol: '', name: '', type: 'Stock', quantity: '', pricePerShare: '', accountId: '' 
  });
  
  const [inputCurrency, setInputCurrency] = useState('USD');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    try {
      const invRes = await fetch('/api/investments', { headers: { 'Authorization': `Bearer ${token}` }});
      if (invRes.ok) {
        const data = await invRes.json();
        console.log('📊 Investments loaded:', data);
        setInvestments(data);
      }

      const accRes = await fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` }});
      if (accRes.ok) {
        const accData = await accRes.json();
        const validAccounts = accData.filter((a: any) => a.name !== 'Investment Portfolio');
        setAccounts(validAccounts);
        if (validAccounts.length > 0) {
          setFormData(prev => ({ ...prev, accountId: validAccounts[0]._id }));
          setDepositAccountId(validAccounts[0]._id);
        }
      }
    } catch (error) { 
      console.error('Fetch Error:', error); 
    } 
    finally { setLoading(false); }
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/investments', { 
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store' // Force fresh data
      });
      if (res.ok) {
        const data = await res.json();
        console.log('🔄 Prices refreshed:', data);
        setInvestments(data);
      }
    } finally { 
      setRefreshing(false); 
    }
  };

  const getLogoUrl = (symbol: string, type: string) => {
    const cleanSym = symbol.split(':')[1] || symbol; 
    const logoSearch = cleanSym.replace('.NS', '').replace('.BO', ''); 
    if (type === 'Crypto') {
      return `https://assets.coincap.io/assets/icons/${logoSearch.toLowerCase().replace('usdt','').replace('usd','')}@2x.png`;
    }
    return `https://logo.clearbit.com/${logoSearch.toLowerCase()}.com`;
  };

  const handleSymbolBlur = async () => {
    if (!formData.symbol) return;
    
    setFetchingPrice(true);
    const token = localStorage.getItem('token');
    let searchSymbol = formData.symbol.toUpperCase();

    // 🧠 Auto-add .NS for Indian stocks when in INR mode
    if (currency === 'INR' && formData.type === 'Stock' && !searchSymbol.includes('.') && searchSymbol.length <= 5) {
      searchSymbol = searchSymbol + '.NS';
      setFormData(prev => ({ ...prev, symbol: searchSymbol }));
    }

    try {
      console.log(`🔍 Auto-fetching ${searchSymbol}`);
      const res = await fetch(`/api/quote?symbol=${searchSymbol}&type=${formData.type}`, { 
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store' // Fresh data every time
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Quote result:', data);
        
        if (data.price && data.price > 0) {
          setFormData(prev => ({ 
            ...prev, 
            pricePerShare: data.price.toString(),
            name: data.shortName || prev.name 
          }));
          setInputCurrency(data.currency || 'USD');
          
          // 🎉 SUCCESS TOAST (Optional - add react-hot-toast)
          console.log(`✅ ${searchSymbol}: $${data.price}`);
        } else {
          console.log('⚠️ No price found, manual entry required');
        }
      }
    } catch (error) {
      console.error("Price fetch failed:", error);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    const qty = Number(formData.quantity);
    let finalPrice = Number(formData.pricePerShare);

    if (qty <= 0 || finalPrice < 0) {
        alert("Invalid Quantity or Price");
        setIsSubmitting(false);
        return;
    }
    
    // Convert INR to USD if needed
    if (inputCurrency === 'INR') {
        finalPrice = finalPrice / 86.5; 
    }

    console.log(`➕ Adding investment: ${formData.symbol} x${qty} @ $${finalPrice.toFixed(2)}`);

    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            ...formData,
            quantity: qty,         
            pricePerShare: finalPrice 
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData(prev => ({ ...prev, symbol: '', name: '', type: 'Stock', quantity: '', pricePerShare: '' }));
        fetchData(); 
      } else {
        const data = await res.json();
        alert(`Failed: ${data.message || 'Unknown Error'}`);
      }
    } catch (error) { 
        console.error('Add Investment Error:', error);
        alert("Network Error"); 
    } 
    finally { setIsSubmitting(false); }
  };

  const handleSellInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/investments/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          investmentId: sellData._id,
          quantityToSell: sellQuantity,
          accountId: depositAccountId
        })
      });
      if (res.ok) { 
        setIsSellModalOpen(false); 
        fetchData(); 
      } else {
        const data = await res.json();
        alert(`Sell failed: ${data.message}`);
      }
    } catch (error) { 
      console.error('Sell Error:', error);
      alert('Network error');
    } 
    finally { setIsSubmitting(false); }
  };

  // Calculate totals (All values are in USD from API)
  const totalPortfolioValue = investments.reduce((sum, item) => sum + (item.currentValue || 0), 0);
  const totalCostBasis = investments.reduce((sum, item) => sum + (item.pricePerShare * item.quantity), 0);
  const totalGain = totalPortfolioValue - totalCostBasis;
  const totalReturnPercent = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  if (loading) {
    return (
      <Shell>
        <div className="flex justify-center items-center h-full text-white">
          <Loader2 className="animate-spin mr-2"/> Loading...
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-8 pb-32">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Investment Portfolio</h1>
            <p className="text-gray-400 text-sm">Track your assets with live market data</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={refreshPrices} 
              disabled={refreshing}
              className={`bg-[#1a1f2e] text-gray-400 hover:text-white p-3 rounded-xl border border-gray-800 transition ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-purple-600 hover:bg-purple-700 transition text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20"
            >
              <Plus size={20} /> Add Investment
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard title="Total Value" value={totalPortfolioValue} />
          <SummaryCard title="Total Gain/Loss" value={totalGain} showColor />
          <SummaryCard title="Return" value={totalReturnPercent} isPercent showColor />
        </div>

        {/* Investments List */}
        <div className="space-y-4">
          {investments.length === 0 ? (
            <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-12 text-center">
              <div className="text-gray-500 mb-4">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No investments yet</p>
                <p className="text-sm mt-2">Add your first investment to start tracking</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 transition text-white px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-2 mt-4"
              >
                <Plus size={20} /> Add Investment
              </button>
            </div>
          ) : (
            investments.map((inv) => {
              return (
                <div 
                  key={inv._id} 
                  className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-5 flex items-start lg:items-center justify-between gap-4 lg:gap-0 hover:border-gray-700 transition group"
                >
                  {/* Logo & Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden shrink-0">
                      <img 
                        src={getLogoUrl(inv.symbol, inv.type)} 
                        alt={inv.symbol} 
                        className="w-full h-full object-contain" 
                        onError={(e) => { 
                          e.currentTarget.src = 'https://via.placeholder.com/40?text=' + inv.symbol[0] 
                        }} 
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold text-lg truncate">{inv.symbol}</h3>
                        <span className="text-xs font-bold text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 uppercase">
                          {inv.type}
                        </span>
                        {/* Live Data Indicator */}
                        {inv.usingLiveData ? (
                          <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            LIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-yellow-500 flex items-center gap-1" title="Using last known price">
                            <AlertCircle size={10} />
                            CACHED
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm font-medium truncate">{inv.name}</p>
                    </div>
                  </div>

                  {/* Holdings Info */}
                  <div className="text-right hidden sm:block">
                    <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Holdings</p>
                    <p className="text-gray-400 font-medium text-sm">{inv.quantity} Shares</p>
                    <p className="text-gray-500 text-xs">Avg Cost: {format(inv.pricePerShare)}</p>
                  </div>

                  {/* NEW P&L SECTION + SELL BUTTON */}
                  <div className="flex items-end gap-4">
                    {/* Enhanced P&L Display */}
                    <div className="flex flex-col gap-1 text-right">
                      <p className="text-white font-bold text-xl">{format(inv.currentValue)}</p>
                      
                      {/* Your Position P&L */}
                      <div className="flex items-center justify-end gap-1 text-xs font-bold" 
                           style={{ color: inv.positionGainLoss >= 0 ? '#10b981' : '#ef4444' }}>
                        {inv.positionGainLossPercent >= 0 ? '+' : ''}{inv.positionGainLossPercent?.toFixed(2)}%
                        <span className="text-gray-500 text-[10px]">(Yours)</span>
                      </div>
                      
                      {/* Daily Market P&L - MATCHES GOOGLE */}
                      <div className="flex items-center gap-1 text-xs" 
                           style={{ color: inv.dailyChangePercent >= 0 ? '#10b981' : '#ef4444' }}>
                        {inv.dailyChangePercent >= 0 ? '+' : ''}{inv.dailyChangePercent.toFixed(2)}% (Daily)
                      </div>
                    </div>

                    {/* Sell Button */}
                    <button 
                      onClick={() => { 
                        setSellData(inv); 
                        setSellQuantity(inv.quantity); 
                        setIsSellModalOpen(true); 
                      }} 
                      className="p-3 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition flex-shrink-0"
                      title="Sell"
                    >
                      <DollarSign size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BUY MODAL */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Add New Investment</h2>
                <button onClick={() => setIsModalOpen(false)} className="modal-close">
                  <X size={24}/>
                </button>
              </div>
              <form onSubmit={handleAddInvestment} className="modal-form">
                <div>
                  <label className="modal-label">Pay from Account</label>
                  <select 
                    className="modal-select text-white" 
                    value={formData.accountId} 
                    onChange={e => setFormData({...formData, accountId: e.target.value})} 
                    required
                  >
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} ({format(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="modal-label">Symbol</label>
                    <input 
                      className="modal-input uppercase" 
                      placeholder="e.g. MSFT or TCS" 
                      value={formData.symbol} 
                      onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} 
                      onBlur={handleSymbolBlur} 
                      required 
                    />
                    {fetchingPrice && <p className="text-xs text-purple-400 mt-1">Fetching price...</p>}
                  </div>
                  <div>
                    <label className="modal-label">Type</label>
                    <select 
                      className="modal-select text-white" 
                      value={formData.type} 
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Stock">Stock</option>
                      <option value="Crypto">Crypto</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="modal-label">Name</label>
                  <input 
                    className="modal-input" 
                    placeholder="e.g. Microsoft" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="modal-label">Quantity</label>
                    <input 
                      type="number" 
                      step="any"
                      className="modal-input" 
                      placeholder="0" 
                      value={formData.quantity} 
                      onChange={e => setFormData({...formData, quantity: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="modal-label">Price per Share</label>
                    <div className="flex">
                      <input 
                        type="number" 
                        step="any"
                        className="modal-input rounded-r-none border-r-0" 
                        placeholder="0.00" 
                        value={formData.pricePerShare} 
                        onChange={e => setFormData({...formData, pricePerShare: e.target.value})} 
                        required 
                      />
                      <select 
                        className="bg-gray-800 text-white border border-gray-700 rounded-r-xl px-2 text-sm focus:outline-none" 
                        value={inputCurrency} 
                        onChange={(e) => setInputCurrency(e.target.value)}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="modal-btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Add Investment'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SELL MODAL */}
        {isSellModalOpen && sellData && (
          <div className="modal-overlay">
            <div className="modal-content border" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="modal-header">
                <h2 className="modal-title" style={{ color: '#ef4444' }}>
                  Sell {sellData.symbol}
                </h2>
                <button onClick={() => setIsSellModalOpen(false)} className="modal-close">
                  <X size={24}/>
                </button>
              </div>
              <form onSubmit={handleSellInvestment} className="modal-form">
                <div 
                  className="p-4 rounded-xl border mb-2" 
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                >
                  <p className="text-sm text-gray-400 mb-1">Current Holdings</p>
                  <p className="text-2xl font-bold text-white">{sellData.quantity} Shares</p>
                  <p className="text-xs text-gray-500">Value: {format(sellData.currentValue || 0)}</p>
                </div>
                
                <div>
                  <label className="modal-label">Shares to Sell</label>
                  <input 
                    type="number" 
                    step="any"
                    className="modal-input" 
                    value={sellQuantity} 
                    onChange={e => setSellQuantity(e.target.value)} 
                    max={sellData.quantity} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="modal-label">Deposit Funds To</label>
                  <select 
                    className="modal-select text-white" 
                    value={depositAccountId} 
                    onChange={e => setDepositAccountId(e.target.value)} 
                    required
                  >
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} (Bal: {format(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full text-white font-bold py-3 rounded-xl transition bg-red-500 hover:opacity-90" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Selling...' : 'Confirm Sell'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

// Summary Card Component
function SummaryCard({ title, value, isPercent, showColor }: any) {
  const { format } = useCurrency();
  let colorStyle = { color: 'white' };
  let iconBg = 'transparent';
  let iconColor = 'white';

  if (showColor) {
    if (value > 0) { 
      colorStyle = { color: '#10b981' }; 
      iconBg = 'rgba(16, 185, 129, 0.1)'; 
      iconColor = '#10b981'; 
    }
    if (value < 0) { 
      colorStyle = { color: '#ef4444' }; 
      iconBg = 'rgba(239, 68, 68, 0.1)'; 
      iconColor = '#ef4444'; 
    }
  }

  return (
    <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <p className="text-gray-400 font-medium text-sm">{title}</p>
        {showColor && value !== 0 && (
          <div 
            className="p-2 rounded-lg flex items-center justify-center" 
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            {value > 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
          </div>
        )}
      </div>
      <h2 className="text-3xl font-bold tracking-tight" style={colorStyle}>
        {isPercent ? `${value.toFixed(2)}%` : format(value)}
      </h2>
    </div>
  );
}
