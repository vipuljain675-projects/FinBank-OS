'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { useCurrency } from '@/context/CurrencyContext'; 
import { 
  ArrowUpRight, ArrowDownLeft, Search, Plus, X, CreditCard, Landmark, 
  Send, Building2, User, Wallet, Hash, Globe
} from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const { format, currency } = useCurrency();

  const [filterType, setFilterType] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false); // Manual Log
  const [isTransferOpen, setIsTransferOpen] = useState(false); // 🏦 New Wire Transfer
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🏦 BANKING SIMULATION STATES
  const [transferStep, setTransferStep] = useState(1); // 1: Details, 2: Processing, 3: Success
  const [isProcessing, setIsProcessing] = useState(false);

  // --- FORMS ---
  const [txType, setTxType] = useState('expense'); 
  const [paymentMethod, setPaymentMethod] = useState('account'); 

  // Manual Transaction Form (Your Original)
  const [formData, setFormData] = useState({
    name: '', amount: '', category: 'Food & Dining', accountId: '', cardId: '', date: new Date().toISOString().split('T')[0]
  });

  // 🏦 Wire Transfer Form (New)
  const [transferData, setTransferData] = useState({
    fromAccountId: '', recipientName: '', bankName: '', accountNumber: '', ifscCode: '', amount: '', currency: 'INR', note: ''
  });

  const categories = ['Salary', 'Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Healthcare', 'Education', 'Investment', 'Transfer', 'Other'];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    
    try {
      const [txRes, accRes, cardRes] = await Promise.all([
        fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/cards', { headers: { 'Authorization': `Bearer ${token}` }})
      ]);

      if (txRes.ok) setTransactions(await txRes.json());
      
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData);
        // Set defaults for both forms
        if (accData.length > 0) {
            setFormData(prev => ({ ...prev, accountId: accData[0]._id }));
            setTransferData(prev => ({ ...prev, fromAccountId: accData[0]._id }));
        }
      }

      if (cardRes.ok) setCards(await cardRes.json());

    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // --- 1. HANDLE MANUAL TRANSACTION (Your Original Logic) ---
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    const finalMethod = txType === 'income' ? 'account' : paymentMethod;
    
    let finalAmount = parseFloat(formData.amount);
    if (currency === 'INR') finalAmount = finalAmount / 86.5; 

    const payload = {
      ...formData,
      amount: finalAmount,
      type: txType, 
      accountId: finalMethod === 'account' ? formData.accountId : undefined,
      cardId: finalMethod === 'card' ? formData.cardId : undefined
    };

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData(prev => ({ ...prev, name: '', amount: '' }));
        fetchData();
      } else { alert("Transaction Failed"); }
    } catch (error) { alert("Network Error"); } 
    finally { setIsSubmitting(false); }
  };

  // --- 2. 🏦 HANDLE WIRE TRANSFER (New Banking Logic) ---
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferStep(2); // Show Processing
    setIsProcessing(true);
    const token = localStorage.getItem('token');

    // Simulate 2.5s Bank Delay
    setTimeout(async () => {
        try {
          const res = await fetch('/api/transactions/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(transferData)
          });
          const data = await res.json();
          if (res.ok) {
            setTransferStep(3); // Show Success
            fetchData(); 
          } else {
            alert(`❌ Transfer Failed: ${data.message}`);
            setTransferStep(1);
          }
        } catch (error) {
          alert("Network Error");
          setTransferStep(1);
        } finally {
          setIsProcessing(false);
        }
    }, 2500);
  };

  const resetTransferModal = () => {
      setIsTransferOpen(false);
      setTransferStep(1);
      setTransferData(prev => ({ ...prev, recipientName: '', amount: '', bankName: '', accountNumber: '', ifscCode: '' }));
  };

  // --- GROUPING LOGIC (For "Pro" Look) ---
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || (filterType === 'Income' && tx.type === 'income') || (filterType === 'Expense' && tx.type === 'expense');
    return matchesSearch && matchesType;
  });

  const groupedTransactions = filteredTransactions.reduce((groups: any, tx) => {
    const date = new Date(tx.date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (date.toDateString() === today.toDateString()) key = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';

    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
    return groups;
  }, {});

  if (loading) return <Shell><div className="flex justify-center items-center h-full text-white">Loading...</div></Shell>;

  return (
    <Shell>
      <div className="space-y-6 relative pb-32">
        <div className="flex justify-between items-end">
          <div><h1 className="text-2xl font-bold text-white mb-1">Transactions</h1><p className="text-gray-400 text-sm">View history & transfer funds</p></div>
          <div className="flex gap-2">
            {/* 🏦 NEW WIRE TRANSFER BUTTON */}
            <button onClick={() => setIsTransferOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition">
                <Send size={16} /> Pay Someone
            </button>
            {/* ORIGINAL ADD BUTTON */}
            <button onClick={() => setIsModalOpen(true)} className="bg-[#1a1f2e] border border-gray-700 hover:border-white text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                <Plus size={16} /> Add Log
            </button>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col md:flex-row gap-4 items-center w-full">
          <div className="relative w-full md:flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
             <input type="text" placeholder="Search..." className="w-full bg-[#1a1f2e] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-purple-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex bg-[#1a1f2e] p-1 rounded-xl border border-gray-800 shrink-0">
             {['All', 'Income', 'Expense'].map((type) => (
               <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === type ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>{type}</button>
             ))}
          </div>
        </div>

        {/* Transactions List (Grouped + Logos) */}
        <div className="space-y-6">
          {Object.keys(groupedTransactions).map(dateKey => (
            <div key={dateKey}>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 ml-1">{dateKey}</h3>
              <div className="space-y-3">
                {groupedTransactions[dateKey].map((tx: any) => (
                  <div key={tx._id} className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-600 transition">
                    <div className="flex items-center gap-4">
                      {/* LOGO LOGIC */}
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-800 flex items-center justify-center">
                         {tx.logo ? (
                            <img src={tx.logo} alt="logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }} />
                         ) : null}
                         <div className={`w-full h-full flex items-center justify-center ${tx.logo ? 'hidden' : ''} ${tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                         </div>
                      </div>
                      
                      <div>
                        <p className="text-white font-medium text-sm">{tx.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                           <span>{tx.category}</span>
                           <span>•</span>
                           {tx.cardId ? (
                              <span className="flex items-center gap-1 text-purple-400"><CreditCard size={10} /> {tx.cardId.brand} **{tx.cardId.last4?.slice(-4) || 'CARD'}</span>
                           ) : (
                              <span>Account</span>
                           )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}{format(Math.abs(tx.amount))}
                      </p>
                      <p className="text-[10px] text-gray-500">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* --- MODAL 1: MANUAL TRANSACTION (Your Original) --- */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header"><h2 className="modal-title">New Log</h2><button onClick={() => setIsModalOpen(false)} className="modal-close"><X size={24}/></button></div>
              <form onSubmit={handleAddTransaction} className="modal-form">
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900 rounded-lg mb-4 border border-gray-800">
                  <button type="button" onClick={() => { setTxType('expense'); setPaymentMethod('account'); }} className={`py-2 text-sm font-bold rounded-md transition ${txType === 'expense' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}>Expense</button>
                  <button type="button" onClick={() => { setTxType('income'); setPaymentMethod('account'); }} className={`py-2 text-sm font-bold rounded-md transition ${txType === 'income' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'}`}>Income</button>
                </div>
                {txType === 'expense' && (
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800/50 rounded-lg mb-2">
                    <button type="button" onClick={() => setPaymentMethod('account')} className={`py-2 text-sm font-medium rounded-md transition ${paymentMethod === 'account' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Bank Transfer</button>
                    <button type="button" onClick={() => setPaymentMethod('card')} className={`py-2 text-sm font-medium rounded-md transition ${paymentMethod === 'card' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>Card Payment</button>
                  </div>
                )}
                {(txType === 'income' || paymentMethod === 'account') ? (
                   <div><label className="modal-label">{txType === 'income' ? 'Deposit To' : 'Pay From'}</label><div className="relative"><select className="modal-select text-white pl-10" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})} required>{accounts.map(acc => (<option key={acc._id} value={acc._id}>{acc.name} ({format(acc.balance)})</option>))}</select><Landmark className="absolute left-3 top-3 text-gray-400" size={18}/></div></div>
                ) : (
                  <div><label className="modal-label">Pay From Card</label><div className="relative"><select className="modal-select text-white pl-10" value={formData.cardId} onChange={e => setFormData({...formData, cardId: e.target.value})} required={paymentMethod === 'card'}><option value="" disabled>Choose a card...</option>{cards.map(card => (<option key={card._id} value={card._id}>{card.brand} (**** {card.cardNumber.slice(-4)})</option>))}</select><CreditCard className="absolute left-3 top-3 text-gray-400" size={18}/></div></div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="modal-label">Amount ({currency})</label><input type="number" className="modal-input" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required/></div>
                  <div><label className="modal-label">Category</label><select className="modal-select text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                </div>
                <div><label className="modal-label">Description</label><input className="modal-input" placeholder="e.g. Starbucks" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required/></div>
                <button type="submit" className={`w-full py-3 rounded-xl font-bold text-white transition mt-2 ${txType === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : (txType === 'income' ? 'Receive Income' : 'Pay Now')}</button>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL 2: 🏦 WIRE TRANSFER (New Banking) --- */}
        {isTransferOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              {transferStep === 1 && (
                  <>
                    <div className="modal-header"><h2 className="modal-title flex items-center gap-2"><Building2 size={20} className="text-purple-500"/> Wire Transfer</h2><button onClick={resetTransferModal} className="modal-close"><X size={24}/></button></div>
                    <form onSubmit={handleTransfer} className="modal-form">
                        <div className="bg-gray-800/30 p-3 rounded-xl border border-gray-700 mb-2">
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">From Account</label>
                            <div className="flex items-center gap-3"><Wallet className="text-purple-500" size={20}/><select className="w-full bg-transparent text-white font-bold outline-none" value={transferData.fromAccountId} onChange={e => setTransferData({...transferData, fromAccountId: e.target.value})}>{accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name} ({format(acc.balance)})</option>)}</select></div>
                        </div>
                        <div className="space-y-3 border-t border-gray-800 pt-3">
                            <div><label className="modal-label">Recipient Name</label><div className="relative"><input className="modal-input pl-10" placeholder="e.g. Dr. Rajesh Sharma" value={transferData.recipientName} onChange={e => setTransferData({...transferData, recipientName: e.target.value})} required /><User className="absolute left-3 top-3 text-gray-400" size={18} /></div></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="modal-label">Bank Name</label><div className="relative"><input className="modal-input pl-10" placeholder="e.g. HDFC" value={transferData.bankName} onChange={e => setTransferData({...transferData, bankName: e.target.value})} required /><Building2 className="absolute left-3 top-3 text-gray-400" size={18} /></div></div>
                                <div><label className="modal-label">IFSC Code</label><div className="relative"><input className="modal-input pl-10 uppercase" placeholder="HDFC000123" value={transferData.ifscCode} onChange={e => setTransferData({...transferData, ifscCode: e.target.value})} required /><Globe className="absolute left-3 top-3 text-gray-400" size={18} /></div></div>
                            </div>
                            <div><label className="modal-label">Account Number</label><div className="relative"><input className="modal-input pl-10" placeholder="000000000000" value={transferData.accountNumber} onChange={e => setTransferData({...transferData, accountNumber: e.target.value})} required /><Hash className="absolute left-3 top-3 text-gray-400" size={18} /></div></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="col-span-2"><label className="modal-label">Amount</label><input type="number" className="modal-input" placeholder="0.00" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} required /></div>
                            <div><label className="modal-label">Currency</label><select className="modal-select text-white" value={transferData.currency} onChange={e => setTransferData({...transferData, currency: e.target.value})}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option></select></div>
                        </div>
                        <button type="submit" className="w-full py-3 rounded-xl font-bold text-white transition mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 shadow-lg">Initiate Transfer</button>
                    </form>
                  </>
              )}
              {transferStep === 2 && (
                  <div className="flex flex-col items-center justify-center py-10"><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div><h3 className="text-xl font-bold text-white">Contacting Bank...</h3><p className="text-gray-400 text-sm mt-2">Verifying Secure Connection...</p></div>
              )}
              {transferStep === 3 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4"><Send size={32} /></div>
                      <h3 className="text-2xl font-bold text-white mb-1">Transfer Successful!</h3>
                      <p className="text-gray-400 text-sm mb-6">Money sent to {transferData.recipientName}</p>
                      <div className="bg-gray-800/50 p-4 rounded-xl w-full text-left mb-6 border border-gray-700">
                          <div className="flex justify-between mb-2"><span className="text-gray-400 text-xs">Amount</span><span className="text-white font-bold">{transferData.amount} {transferData.currency}</span></div>
                          <div className="flex justify-between mb-2"><span className="text-gray-400 text-xs">Bank</span><span className="text-white font-bold">{transferData.bankName}</span></div>
                      </div>
                      <button onClick={resetTransferModal} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold transition">Done</button>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}