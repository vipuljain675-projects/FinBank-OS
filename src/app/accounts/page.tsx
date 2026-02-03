'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { useCurrency } from '@/context/CurrencyContext';
import { Plus, Wallet, Loader2, Trash2, TrendingUp, PiggyBank, Briefcase, Bitcoin } from 'lucide-react';

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { format, currency } = useCurrency();

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

    let finalBalance = parseFloat(newAccount.balance);
    if (currency === 'INR') {
      finalBalance = finalBalance / 86.5;
    }

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newAccount,
          balance: finalBalance
        })
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setNewAccount({ name: '', type: 'Checking', balance: '' });
        fetchAccounts();
      } else {
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
      <div className="space-y-8 pb-32">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Accounts</h1>
            <p className="text-gray-400 text-sm">Manage all your accounts in one place</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 transition text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <Plus size={18} />
            Add Account
          </button>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-900/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <Wallet className="text-white" size={24} />
            </div>
            <span className="text-purple-100 font-medium text-sm">Total Balance</span>
          </div>
          <h2 className="text-5xl font-bold text-white tracking-tight">
            {format(totalBalance)}
          </h2>
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.length > 0 ? (
            accounts.map((acc) => <AccountCard key={acc._id} account={acc} format={format} />)
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-[#1a1f2e] rounded-2xl border border-gray-800 border-dashed">
              <div className="bg-[#111827] p-6 rounded-2xl mb-4">
                <Wallet size={32} className="opacity-50" />
              </div>
              <p className="text-lg mb-2">No accounts found</p>
              <p className="text-sm text-gray-600 mb-6">Get started by creating your first account</p>
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition"
              >
                Create Account
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
                <button onClick={() => setIsModalOpen(false)} className="modal-close">
                  <Plus className="rotate-45" size={24}/>
                </button>
              </div>
              <form onSubmit={handleAddAccount} className="modal-form">
                <div>
                  <label className="modal-label">Account Name</label>
                  <input 
                    className="modal-input" 
                    placeholder="e.g. Primary Checking" 
                    value={newAccount.name} 
                    onChange={e => setNewAccount({...newAccount, name: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="modal-label">Account Type</label>
                  <select 
                    className="modal-select text-white" 
                    value={newAccount.type} 
                    onChange={e => setNewAccount({...newAccount, type: e.target.value})}
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Investment">Investment</option>
                    <option value="Crypto">Crypto Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="modal-label">Initial Balance ({currency})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="modal-input" 
                    placeholder="0.00" 
                    value={newAccount.balance} 
                    onChange={e => setNewAccount({...newAccount, balance: e.target.value})} 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  className="modal-btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

// --- ACCOUNT CARD COMPONENT ---
function AccountCard({ account, format }: any) {
  const getAccountConfig = (type: string) => {
    const configs: any = {
      'investment': { 
        icon: TrendingUp, 
        color: 'bg-pink-500/10 text-pink-500', 
        label: 'Investment',
        badgeBg: 'bg-pink-500/10 border-pink-500/20 text-pink-400'
      },
      'checking': { 
        icon: Wallet, 
        color: 'bg-blue-500/10 text-blue-500', 
        label: 'Checking',
        badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
      },
      'crypto': { 
        icon: Bitcoin, 
        color: 'bg-orange-500/10 text-orange-500', 
        label: 'Crypto',
        badgeBg: 'bg-orange-500/10 border-orange-500/20 text-orange-400'
      },
      'savings': { 
        icon: PiggyBank, 
        color: 'bg-green-500/10 text-green-500', 
        label: 'Savings',
        badgeBg: 'bg-green-500/10 border-green-500/20 text-green-400'
      }
    };
    
    const typeKey = type ? type.toLowerCase() : 'checking';
    return configs[typeKey] || configs['checking'];
  };

  const config = getAccountConfig(account.type || 'checking');
  const Icon = config.icon;

  return (
    <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all group cursor-pointer hover:shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-xl ${config.color}`}>
          <Icon size={24} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${config.badgeBg}`}>
          {config.label}
        </span>
      </div>
      <div>
        <h4 className="text-gray-400 font-medium text-sm mb-2">{account.name}</h4>
        <h2 className="text-3xl font-bold text-white mb-2">
          {format(account.balance)}
        </h2>
        <p className="text-xs text-gray-600 font-mono">**** **** **** {account._id.slice(-4)}</p>
      </div>
    </div>
  );
}