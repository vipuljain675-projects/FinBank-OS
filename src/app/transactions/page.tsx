'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { useCurrency } from '@/context/CurrencyContext'; // 🌍 Import Currency Hook
import { 
  ArrowUpRight, ArrowDownLeft, Search, Plus, X, CreditCard, Landmark
} from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // 🌍 Get the formatter and currency state
  const { format, currency } = useCurrency();

  const [filterType, setFilterType] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [txType, setTxType] = useState('expense'); 
  const [paymentMethod, setPaymentMethod] = useState('account'); 

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'Food & Dining',
    accountId: '',
    cardId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Salary', 'Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Healthcare', 'Education', 'Investment', 'Transfer', 'Other'];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    
    try {
      const txRes = await fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` }});
      if (txRes.ok) setTransactions(await txRes.json());

      const accRes = await fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` }});
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData);
        if (accData.length > 0) setFormData(prev => ({ ...prev, accountId: accData[0]._id }));
      }

      const cardRes = await fetch('/api/cards', { headers: { 'Authorization': `Bearer ${token}` }});
      if (cardRes.ok) setCards(await cardRes.json());

    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // --- 🔥 FIXED ADD FUNCTION (PRESERVING YOUR FEATURES) 🔥 ---
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    // 1. Determine Payment Method (Account vs Card)
    const finalMethod = txType === 'income' ? 'account' : paymentMethod;
    
    // 2. 🚀 CURRENCY FIX: Convert INR input to USD for backend
    let finalAmount = parseFloat(formData.amount);
    if (currency === 'INR') {
        // If user types ₹1,00,000, convert to ~$1156 USD
        finalAmount = finalAmount / 86.5; 
    }

    // 3. Construct Payload
    const payload = {
      ...formData,
      amount: finalAmount, // ✅ Send converted amount
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

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        // Reset form but keep IDs valid if possible
        setFormData(prev => ({ ...prev, name: '', amount: '' }));
        fetchData();
      } else {
        alert(data.message || "Transaction Failed");
      }
    } catch (error) {
      alert("Network Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || 
                        (filterType === 'Income' && tx.type === 'income') ||
                        (filterType === 'Expense' && tx.type === 'expense');
    return matchesSearch && matchesType;
  });

  if (loading) return <Shell><div className="flex justify-center items-center h-full text-white">Loading...</div></Shell>;

  return (
    <Shell>
      <div className="space-y-6 relative pb-32">
        <div className="flex justify-between items-end">
          <div><h1 className="text-2xl font-bold text-white mb-1">Transactions</h1><p className="text-gray-400 text-sm">View and manage all transactions</p></div>
          <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus size={16} /> Add Transaction</button>
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

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
            <div key={tx._id} className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-600 transition">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
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
                {/* 🌍 Dynamic Currency */}
                <p className={`font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                  {tx.type === 'income' ? '+' : '-'}{format(Math.abs(tx.amount))}
                </p>
                <p className="text-[10px] text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
              </div>
            </div>
          )) : (
             <div className="text-center py-10 text-gray-500">No transactions found.</div>
          )}
        </div>

        {/* --- ADD TRANSACTION MODAL --- */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">New Transaction</h2>
                <button onClick={() => setIsModalOpen(false)} className="modal-close"><X size={24}/></button>
              </div>

              <form onSubmit={handleAddTransaction} className="modal-form">
                
                {/* Income / Expense Switch */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900 rounded-lg mb-4 border border-gray-800">
                  <button type="button" onClick={() => { setTxType('expense'); setPaymentMethod('account'); }} className={`py-2 text-sm font-bold rounded-md transition ${txType === 'expense' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                    Expense
                  </button>
                  <button type="button" onClick={() => { setTxType('income'); setPaymentMethod('account'); }} className={`py-2 text-sm font-bold rounded-md transition ${txType === 'income' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                    Income
                  </button>
                </div>

                {/* Payment Method Switch (Only for Expense) */}
                {txType === 'expense' && (
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800/50 rounded-lg mb-2">
                    <button type="button" onClick={() => setPaymentMethod('account')} className={`py-2 text-sm font-medium rounded-md transition ${paymentMethod === 'account' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                      Bank Transfer
                    </button>
                    <button type="button" onClick={() => setPaymentMethod('card')} className={`py-2 text-sm font-medium rounded-md transition ${paymentMethod === 'card' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                      Card Payment
                    </button>
                  </div>
                )}
                
                {(txType === 'income' || paymentMethod === 'account') ? (
                   <div>
                    <label className="modal-label">{txType === 'income' ? 'Deposit To Account' : 'Pay From Account'}</label>
                    <div className="relative">
                      <select className="modal-select text-white pl-10" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})} required>
                        {/* 🌍 Dynamic Currency in Dropdown */}
                        {accounts.map(acc => (<option key={acc._id} value={acc._id}>{acc.name} ({format(acc.balance)})</option>))}
                      </select>
                      <Landmark className="absolute left-3 top-3 text-gray-400" size={18}/>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="modal-label">Pay From Card</label>
                    <div className="relative">
                      <select className="modal-select text-white pl-10" value={formData.cardId} onChange={e => setFormData({...formData, cardId: e.target.value})} required={paymentMethod === 'card'}>
                        <option value="" disabled>Choose a card...</option>
                        {cards.map(card => (
                          <option key={card._id} value={card._id}>
                            {card.brand} (**** {card.cardNumber.slice(-4)}) - {card.status}
                          </option>
                        ))}
                      </select>
                      <CreditCard className="absolute left-3 top-3 text-gray-400" size={18}/>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {/* Display current selected currency label */}
                    <label className="modal-label">Amount ({currency})</label>
                    <input type="number" className="modal-input" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required/>
                  </div>
                  <div>
                    <label className="modal-label">Category</label>
                    <select className="modal-select text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="modal-label">Description</label>
                  <input className="modal-input" placeholder={txType === 'income' ? "e.g. September Salary" : "e.g. Starbucks"} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required/>
                </div>

                <button 
                  type="submit" 
                  className={`w-full py-3 rounded-xl font-bold text-white transition mt-2 ${txType === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : (txType === 'income' ? 'Receive Income' : 'Pay Now')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}