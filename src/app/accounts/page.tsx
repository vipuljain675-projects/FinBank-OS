// src/app/accounts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { Plus, Wallet, Loader2, Trash2 } from 'lucide-react';

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'Checking', balance: '' });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    try {
      const res = await fetch('/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAccount)
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setNewAccount({ name: '', type: 'Checking', balance: '' });
        fetchAccounts();
      } else {
        // --- ERROR ALERT ---
        alert(`Failed to create account: ${data.message || 'Unknown Error'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAccounts = async () => {
    if (!confirm("⚠️ ARE YOU SURE? This will delete ALL accounts.")) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/accounts/reset', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert("All accounts deleted.");
        fetchAccounts(); 
      }
    } catch (error) {
      console.error("Reset failed", error);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  if (loading) return (
    <Shell>
      <div className="flex items-center justify-center h-full text-white">
        <Loader2 className="animate-spin mr-2" /> Loading Accounts...
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Accounts</h1>
            <p className="text-gray-400 text-sm">Manage all your accounts in one place</p>
          </div>
          <div className="flex gap-3">
            {/* RESET BUTTON */}
            {accounts.length > 0 && (
              <button 
                onClick={handleResetAccounts}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                title="Delete All Accounts"
              >
                <Trash2 size={18} />
              </button>
            )}
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 transition text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <Plus size={18} />
              Add Account
            </button>
          </div>
        </div>

        {/* Total Balance Card */}
        <div className="bg-[#1a1f2e] border border-gray-800 p-8 rounded-2xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-gray-800 p-3 rounded-xl">
              <Wallet className="text-white" size={24} />
            </div>
            <span className="text-gray-400 font-medium">Net Worth</span>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.length > 0 ? (
            accounts.map((acc) => (
              <div key={acc._id} className="bg-[#1a1f2e] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">{acc.type}</p>
                    <h3 className="text-xl font-bold text-white">{acc.name}</h3>
                  </div>
                  <div className="bg-[#111827] p-2 rounded-lg text-gray-400 group-hover:text-white transition">
                    <Wallet size={20} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 font-mono">**** {acc._id.slice(-4)}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500 bg-[#1a1f2e] rounded-2xl border border-gray-800 border-dashed">
              <div className="bg-[#111827] p-4 rounded-full mb-3">
                <Wallet size={24} className="opacity-50" />
              </div>
              <p>No accounts found.</p>
              <button onClick={() => setIsModalOpen(true)} className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-semibold">
                Create your first account
              </button>
            </div>
          )}
        </div>

        {/* Add Account Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Add New Account</h2>
                <button onClick={() => setIsModalOpen(false)} className="modal-close"><Plus className="rotate-45" size={24}/></button>
              </div>
              <form onSubmit={handleAddAccount} className="modal-form">
                <div>
                  <label className="modal-label">Account Name</label>
                  <input className="modal-input" placeholder="e.g. Chase Checking" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} required />
                </div>
                <div>
                  <label className="modal-label">Type</label>
                  <select className="modal-select text-white" value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value})}>
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Investment">Investment</option>
                    <option value="Business">Business</option>
                    <option value="Crypto">Crypto Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="modal-label">Initial Balance</label>
                  <input type="number" className="modal-input" placeholder="0.00" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: e.target.value})} required />
                </div>
                <button type="submit" className="modal-btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Account'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}