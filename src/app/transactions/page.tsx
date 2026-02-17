'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { useCurrency } from '@/context/CurrencyContext'; 
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  ArrowUpRight, ArrowDownLeft, Search, Plus, X, CreditCard, Landmark, 
  Send, Building2, User, Wallet, Hash, Globe, MapPin, Loader2,
  Share2, CheckCircle2, Download, FileText
} from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null); 
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const { format, currency } = useCurrency();

  const [filterType, setFilterType] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- BANKING SIMULATION STATES ---
  const [transferStep, setTransferStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // IFSC Lookup States
  const [branchLocation, setBranchLocation] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  // --- FORMS ---
  const [txType, setTxType] = useState('expense'); 
  const [paymentMethod, setPaymentMethod] = useState('account'); 

  const [formData, setFormData] = useState({
    name: '', amount: '', category: 'Food & Dining', accountId: '', cardId: '', date: new Date().toISOString().split('T')[0]
  });

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
        if (accData.length > 0) {
            setFormData(prev => ({ ...prev, accountId: accData[0]._id }));
            setTransferData(prev => ({ ...prev, fromAccountId: accData[0]._id }));
        }
      }
      if (cardRes.ok) setCards(await cardRes.json());
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // --- WHATSAPP SHARE LOGIC ---
  const shareToWhatsApp = () => {
    const amountStr = `${transferData.currency === 'INR' ? '₹' : '$'}${transferData.amount}`;
    const message = encodeURIComponent(
      `✅ *Transaction Successful!*\n\n` +
      `💰 *Amount:* ${amountStr}\n` +
      `👤 *Recipient:* ${transferData.recipientName}\n` +
      `🏦 *Bank:* ${transferData.bankName}\n` +
      `📍 *Branch:* ${branchLocation || 'Digital Hub'}\n\n` +
      `Sent via *FinBank OS*`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // --- PDF DOWNLOAD LOGIC ---
  const downloadReceipt = async () => {
    if (!receiptRef.current) return;
    const canvas = await html2canvas(receiptRef.current, {
      backgroundColor: '#1e2536',
      scale: 3,
      useCORS: true
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save(`FinBank_Receipt_${transferData.recipientName}.pdf`);
  };

  const handleIFSCChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const ifsc = e.target.value.toUpperCase();
    setTransferData({ ...transferData, ifscCode: ifsc });
    if (ifsc.length === 11) {
      setIsLookupLoading(true);
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
        if (res.ok) {
          const data = await res.json();
          setTransferData(prev => ({ ...prev, bankName: data.BANK }));
          setBranchLocation(`${data.BRANCH}, ${data.CITY}`);
        } else {
          setBranchLocation('Invalid IFSC Code');
        }
      } catch (err) {
        setBranchLocation('Lookup failed');
      } finally {
        setIsLookupLoading(false);
      }
    } else {
      setBranchLocation('');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferStep(2);
    setIsProcessing(true);
    const token = localStorage.getItem('token');
    setTimeout(async () => {
        try {
          const res = await fetch('/api/transactions/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...transferData, branchLocation })
          });
          if (res.ok) {
            setTransferStep(3);
            fetchData(); 
          } else {
            setTransferStep(1);
          }
        } catch (error) {
          setTransferStep(1);
        } finally {
          setIsProcessing(false);
        }
    }, 2500);
  };

  const resetTransferModal = () => {
      setIsTransferOpen(false);
      setTransferStep(1);
      setBranchLocation('');
      setTransferData(prev => ({ ...prev, recipientName: '', amount: '', bankName: '', accountNumber: '', ifscCode: '' }));
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || (filterType === 'Income' && tx.type === 'income') || (filterType === 'Expense' && tx.type === 'expense');
    return matchesSearch && matchesType;
  });

  const groupedTransactions = filteredTransactions.reduce((groups: any, tx) => {
    const date = new Date(tx.date);
    let key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
    return groups;
  }, {});

  if (loading) return <Shell><div className="flex justify-center items-center h-full text-white">Loading...</div></Shell>;

  return (
    <Shell>
      <div className="space-y-6 relative pb-32">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div><h1 className="text-2xl font-bold text-white mb-1">Transactions</h1><p className="text-gray-400 text-sm">View history & transfer funds</p></div>
          <div className="flex gap-2">
            <button onClick={() => setIsTransferOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition">
                <Send size={16} /> Pay Someone
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#1a1f2e] border border-gray-700 hover:border-white text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                <Plus size={16} /> Add Log
            </button>
          </div>
        </div>

        {/* List Content (Search & Groups) */}
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

        <div className="space-y-6">
          {Object.keys(groupedTransactions).map(dateKey => (
            <div key={dateKey}>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 ml-1">{dateKey}</h3>
              <div className="space-y-3">
                {groupedTransactions[dateKey].map((tx: any) => (
                  <div key={tx._id} className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-600 transition text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-800 flex items-center justify-center">
                         {tx.logo ? <img src={tx.logo} alt="logo" className="w-full h-full object-cover" /> : 
                         <div className={`w-full h-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                         </div>}
                      </div>
                      <div><p className="font-medium text-sm">{tx.name}</p><p className="text-xs text-gray-400 truncate max-w-[200px]">{tx.paymentMethod || tx.category}</p></div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-white'}`}>{tx.type === 'income' ? '+' : '-'}{format(Math.abs(tx.amount))}</p>
                      <p className="text-[10px] text-gray-500">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* --- WIRE TRANSFER MODAL --- */}
        {isTransferOpen && (
          <div className="modal-overlay">
            <div className="modal-content !max-w-md !bg-[#0f111a] !p-0 overflow-hidden">
              {transferStep === 1 && (
                  <div className="p-6">
                    <div className="modal-header"><h2 className="modal-title flex items-center gap-2 text-white"><Building2 size={20} className="text-purple-500"/> Wire Transfer</h2><button onClick={resetTransferModal} className="modal-close"><X size={24}/></button></div>
                    <form onSubmit={handleTransfer} className="modal-form">
                        <div className="bg-gray-800/30 p-3 rounded-xl border border-gray-700 mb-2">
                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">From Account</label>
                            <div className="flex items-center gap-3 text-white font-bold"><Wallet className="text-purple-500" size={20}/><select className="w-full bg-transparent outline-none" value={transferData.fromAccountId} onChange={e => setTransferData({...transferData, fromAccountId: e.target.value})}>{accounts.map(acc => <option key={acc._id} value={acc._id} className="bg-[#0f111a]">{acc.name} ({format(acc.balance)})</option>)}</select></div>
                        </div>
                        <div className="space-y-3 border-t border-gray-800 pt-3">
                            <div><label className="modal-label">Recipient Name</label><div className="relative"><input className="modal-input pl-10" placeholder="e.g. Dr. Rajesh Sharma" value={transferData.recipientName} onChange={e => setTransferData({...transferData, recipientName: e.target.value})} required /><User className="absolute left-3 top-3 text-gray-400" size={18} /></div></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="modal-label">IFSC Code</label><div className="relative"><input className="modal-input pl-10 uppercase" placeholder="HDFC000123" value={transferData.ifscCode} onChange={handleIFSCChange} maxLength={11} required />{isLookupLoading ? <Loader2 className="absolute left-3 top-3 text-purple-500 animate-spin" size={18} /> : <Globe className="absolute left-3 top-3 text-gray-400" size={18} />}</div>{branchLocation && <p className="text-[9px] mt-1 ml-1 text-purple-400 font-medium italic">{branchLocation}</p>}</div>
                                <div><label className="modal-label">Bank Name</label><div className="relative"><input className="modal-input pl-10" placeholder="e.g. HDFC" value={transferData.bankName} onChange={e => setTransferData({...transferData, bankName: e.target.value})} required /><Building2 className="absolute left-3 top-3 text-gray-400" size={18} /></div></div>
                            </div>
                            <div><label className="modal-label">Account Number</label><div className="relative"><input className="modal-input pl-10" placeholder="0000" value={transferData.accountNumber} onChange={e => setTransferData({...transferData, accountNumber: e.target.value})} required /><Hash className="absolute left-3 top-3 text-gray-400" size={18} /></div></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="col-span-2"><label className="modal-label">Amount</label><input type="number" className="modal-input" placeholder="0.00" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} required /></div>
                            <div><label className="modal-label">Currency</label><select className="modal-select text-white" value={transferData.currency} onChange={e => setTransferData({...transferData, currency: e.target.value})}><option value="INR" className="bg-[#0f111a]">INR (₹)</option><option value="USD" className="bg-[#0f111a]">USD ($)</option></select></div>
                        </div>
                        <button type="submit" className="w-full py-3 rounded-xl font-bold text-white transition mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 shadow-lg">Initiate Transfer</button>
                    </form>
                  </div>
              )}

              {transferStep === 2 && (
                  <div className="flex flex-col items-center justify-center py-16"><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div><h3 className="text-xl font-bold text-white tracking-tight">Processing Payment...</h3></div>
              )}

              {transferStep === 3 && (
                  <div className="flex flex-col items-center p-6 bg-[#0f111a] animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full"></div>
                      <div className="relative w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl"><CheckCircle2 size={32} strokeWidth={3} /></div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 text-center">Transfer Successful!</h3>
                    <p className="text-gray-400 text-[10px] mb-8 text-center uppercase tracking-widest font-bold">Funds Remitted via FinBank OS</p>

                    {/* VOUCHER RECEIPT */}
                    <div ref={receiptRef} className="w-full bg-[#1e2536] border border-gray-700/50 rounded-2xl shadow-2xl relative p-6 mb-8 overflow-hidden">
                      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-[10px] font-bold text-white italic">FB</div><span className="text-[11px] font-black text-white tracking-tighter uppercase">Voucher Copy</span></div>
                        <p className="text-[10px] text-gray-500 font-mono italic">{new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="flex justify-between items-end mb-8">
                         <div><p className="text-[9px] text-gray-500 uppercase font-black mb-1">Total Remittance</p><p className="text-4xl font-black text-white italic">{transferData.currency === 'INR' ? '₹' : '$'}{transferData.amount}</p></div>
                         <FileText className="text-gray-700/30" size={40} />
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-left"><p className="text-[8px] text-gray-500 uppercase font-bold">Recipient</p><p className="text-[11px] text-white font-bold">{transferData.recipientName}</p></div>
                          <div className="text-left"><p className="text-[8px] text-gray-500 uppercase font-bold">Bank Institution</p><p className="text-[11px] text-white font-bold">{transferData.bankName}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-left"><p className="text-[8px] text-gray-500 uppercase font-bold">Account (Tail)</p><p className="text-[11px] text-white font-mono font-bold">****{transferData.accountNumber.slice(-4)}</p></div>
                          <div className="text-left"><p className="text-[8px] text-gray-500 uppercase font-bold">Bank IFSC</p><p className="text-[11px] text-white font-mono font-bold">{transferData.ifscCode}</p></div>
                        </div>
                        <div className="pt-4 border-t border-dashed border-gray-700">
                           <div className="flex items-start gap-2 text-left"><MapPin size={10} className="text-purple-400 mt-1 shrink-0"/><div><p className="text-[8px] text-gray-500 uppercase font-bold">Origin Branch</p><p className="text-[10px] text-white font-medium italic">{branchLocation || 'Digital Verified Branch'}</p></div></div>
                        </div>
                      </div>
                      <div className="mt-8 flex justify-between items-center opacity-40 grayscale"><p className="text-[8px] font-mono text-gray-400">REF: FIN-{Math.floor(Math.random()*10000000)}</p><div className="flex gap-1"><div className="w-1 h-1 bg-white rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div></div></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button onClick={shareToWhatsApp} className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold transition shadow-lg text-xs"><Share2 size={14} /> WhatsApp</button>
                      <button onClick={downloadReceipt} className="flex items-center justify-center gap-2 bg-[#1a1f2e] hover:bg-gray-800 text-white py-3 rounded-xl font-bold transition border border-gray-700 text-xs"><Download size={14} /> PDF Receipt</button>
                    </div>
                    <button onClick={resetTransferModal} className="w-full mt-3 bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-bold transition shadow-lg text-xs">Done</button>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}