'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { useCurrency } from '@/context/CurrencyContext'; // 🌍 Import Currency Hook
import { Plus, Wifi, Lock, Unlock, X, CreditCard, Loader2 } from 'lucide-react';

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🌍 Get the formatter AND currency state
  const { format, currency } = useCurrency();
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({ 
    brand: 'VISA', type: 'virtual', last4: '', expiry: '', monthlyLimit: '', color: 'blue', accountId: '' 
  });

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    try {
      // 1. Fetch Cards
      const cardRes = await fetch('/api/cards', { headers: { 'Authorization': `Bearer ${token}` } });
      if (cardRes.ok) setCards(await cardRes.json());

      // 2. Fetch Accounts (to show "Linked To" names)
      const accRes = await fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } });
      if (accRes.ok) setAccounts(await accRes.json());

      // 3. Fetch Transactions (ONLY used for math now, not displayed)
      const dashRes = await fetch('/api/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setTransactions(dashData.recentTransactions || []);
      }

    } catch (error) { 
      console.error('Fetch error:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  // Calculate Total Spent (to update available balance)
  const totalSpent = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const handleToggleLock = async (cardId: string, currentStatus: string) => {
    const token = localStorage.getItem('token');
    const newStatus = currentStatus === 'Active' ? 'Frozen' : 'Active';
    setCards(prev => prev.map(c => c._id === cardId ? { ...c, status: newStatus } : c));

    try {
      await fetch('/api/cards/toggle', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId })
      });
    } catch (error) {
       setCards(prev => prev.map(c => c._id === cardId ? { ...c, status: currentStatus } : c));
    }
  };

  // --- 🔥 FIXED SUBMIT FUNCTION 🔥 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    let finalLimit = Number(form.monthlyLimit);

    // 🚀 CURRENCY FIX: Convert INR input to USD for backend storage
    if (currency === 'INR') {
        console.log(`Converting Limit ₹${finalLimit} to USD...`);
        finalLimit = finalLimit / 86.5; 
    }

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: form.brand, 
          type: form.type, 
          last4: form.last4, 
          expiry: form.expiry,
          monthlyLimit: finalLimit, // ✅ Send the converted USD value
          color: form.brand === 'MASTERCARD' ? 'orange' : 'blue', 
          accountId: form.accountId
        })
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ brand: 'VISA', type: 'virtual', last4: '', expiry: '', monthlyLimit: '', color: 'blue', accountId: '' });
        fetchData();
      } else { 
        alert('Failed to create card'); 
      }
    } catch (error) { 
        alert('Failed to create card.'); 
    } 
    finally { 
        setIsSubmitting(false); 
    }
  };

  if (loading) return <Shell><div className="flex h-full items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Loading Cards...</div></Shell>;

  return (
    <Shell>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header */}
        <div className="flex justify-between items-center">
           <div><h1 className="text-3xl font-bold text-white mb-1">Cards</h1><p className="text-gray-400 text-sm">Manage your linked debit and credit cards</p></div>
           <button onClick={() => setShowModal(true)} className="bg-purple-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold hover:bg-purple-700 transition"><Plus size={18} /> Add Card</button>
        </div>

        {/* --- CARDS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
           {cards.length === 0 ? (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-[#1a1f2e] rounded-2xl border border-gray-800 border-dashed">
               <CreditCard size={32} className="opacity-50 mb-4" /><p>No cards linked yet.</p>
             </div>
           ) : (
             cards.map((card) => {
               const isActive = card.status === 'Active';
               const isVisa = card.brand === 'VISA';
               const bgStyle = isVisa ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)';
               
               // Dynamic Math: Limit - Spent
               const availableBalance = Math.max(0, card.monthlyLimit - totalSpent);
               // Fix 0000 bug
               const lastFourDigits = card.last4 || (card.cardNumber ? card.cardNumber.slice(-4) : '0000');

               // Get Linked Account Name safely
               const linkedAccountName = card.accountName || card.accountId?.name || 'Unlinked';

               return (
                 <div key={card._id} className="relative group">
                    <div className={`h-[240px] rounded-2xl p-8 relative flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ${!isActive ? 'grayscale opacity-70' : 'hover:scale-[1.02]'}`} style={{ background: bgStyle }}>
                        {/* Top Row */}
                        <div className="flex justify-between items-start z-10">
                           <div>
                              <p className="text-white/80 text-xs font-bold tracking-[0.2em] uppercase mb-2">FinBank {card.type}</p>
                              <div className="w-10 h-7 bg-yellow-400/90 rounded flex items-center justify-center border border-yellow-600/30">
                                 <div className="w-6 h-4 border border-black/10 rounded-[2px] grid grid-cols-2"></div>
                              </div>
                           </div>
                           <div className="text-right">
                              <h2 className="text-white font-bold italic text-2xl tracking-wider">{card.brand}</h2>
                              {isActive && <Wifi className="text-white/50 inline-block mt-2 rotate-90" size={24} />}
                           </div>
                        </div>

                        {/* Card Number */}
                        <div className="z-10 mt-2">
                           <p className="text-white font-mono text-3xl tracking-[0.15em] drop-shadow-md">
                             **** **** **** {lastFourDigits}
                           </p>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex justify-between items-end z-10">
                           <div>
                              <p className="text-white/70 text-[10px] uppercase mb-0.5">Card Holder</p>
                              <p className="text-white font-medium tracking-wide">VIPUL JAIN</p> 
                           </div>
                           
                           <div className="flex gap-6 text-right">
                             <div>
                                <p className="text-white/70 text-[10px] uppercase mb-0.5">Expires</p>
                                <p className="text-white font-mono font-bold">{card.expiry}</p>
                             </div>
                             
                             {/* LINKED TO */}
                             <div>
                                <p className="text-white/70 text-[10px] uppercase mb-0.5">Linked To</p>
                                <p className="text-white font-medium text-sm truncate max-w-[100px]" title={linkedAccountName}>
                                  {linkedAccountName}
                                </p>
                             </div>

                             {/* AVAILABLE BALANCE - 🌍 Dynamic Currency */}
                             <div>
                                <p className="text-white/70 text-[10px] uppercase mb-0.5">Available</p>
                                <p className={`font-bold text-lg ${availableBalance < 500 ? 'text-red-200' : 'text-white'}`}>
                                  {format(availableBalance)}
                                </p>
                             </div>
                           </div>
                        </div>
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    </div>

                    <button onClick={() => handleToggleLock(card._id, card.status)} className="absolute top-6 right-6 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition border border-white/10" title={isActive ? "Freeze Card" : "Unfreeze Card"}>
                      {isActive ? <Unlock size={20} /> : <Lock size={20} />}
                    </button>
                    
                    {!isActive && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">
                          <p className="text-white font-bold tracking-widest uppercase flex items-center gap-2"><Lock size={16}/> Frozen</p>
                        </div>
                      </div>
                    )}
                 </div>
               );
             })
           )}
        </div>

        {/* Modal Logic */}
        {showModal && (
          <div className="modal-overlay">
             <div className="modal-content">
                <div className="modal-header">
                   <h2 className="modal-title">Link New Card</h2>
                   <button onClick={() => setShowModal(false)} className="modal-close"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                   <div>
                      <label className="modal-label">Link to Account</label>
                      <select className="modal-select text-white" value={form.accountId} onChange={(e) => setForm({...form, accountId: e.target.value})} required>
                         <option value="" disabled>Select Bank Account</option>
                         {/* 🌍 Dynamic Currency */}
                         {accounts.map(acc => (<option key={acc._id} value={acc._id}>{acc.name} ({format(acc.balance)})</option>))}
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="modal-label">Type</label>
                         <select className="modal-select text-white" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                            <option value="virtual">Virtual</option>
                            <option value="physical">Physical</option>
                         </select>
                      </div>
                      <div>
                         <label className="modal-label">Brand</label>
                         <select className="modal-select text-white" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})}>
                            <option value="VISA">VISA</option>
                            <option value="MASTERCARD">MASTERCARD</option>
                         </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="modal-label">Last 4 Digits</label>
                         <input type="text" maxLength={4} className="modal-input" placeholder="4521" value={form.last4} onChange={(e) => setForm({...form, last4: e.target.value.replace(/\D/g, '')})} required />
                      </div>
                      <div>
                         <label className="modal-label">Expiry (MM/YY)</label>
                         <input type="text" className="modal-input" placeholder="12/28" maxLength={5} value={form.expiry} onChange={(e) => setForm({...form, expiry: e.target.value})} required />
                      </div>
                   </div>
                   <div>
                      <label className="modal-label">Monthly Limit ({currency})</label>
                      <input type="number" className="modal-input" placeholder="5000" value={form.monthlyLimit} onChange={(e) => setForm({...form, monthlyLimit: e.target.value})} required />
                   </div>
                   <button type="submit" className="modal-btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Issue Card'}</button>
                </form>
             </div>
          </div>
        )}
      </div>
    </Shell>
  );
}