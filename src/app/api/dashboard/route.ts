import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/lib/models/Account';
import Transaction from '@/lib/models/Transaction';
import Investment from '@/lib/models/Investment';
import { verifyToken } from '@/lib/auth';

// --- HELPER: Fetch Live Price ---
async function getLivePrice(symbol: string) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return null;
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.c || null; 
  } catch (error) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });

    await connectToDatabase();
    const userId = decoded.userId;

    // 2. Fetch Accounts
    const accounts = await Account.find({ userId }); // <--- We have this
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 3. Monthly Stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTransactions = await Transaction.find({ userId, date: { $gte: startOfMonth } });
    const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // 4. Portfolio Value
    const investments = await Investment.find({ userId });
    const investmentValues = await Promise.all(investments.map(async (inv) => {
      let price = await getLivePrice(inv.symbol);
      if (!price) price = inv.pricePerShare; 
      return price * inv.quantity;
    }));
    const portfolioValue = investmentValues.reduce((sum, val) => sum + val, 0);

    // 5. Recent Transactions
    const recentTransactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(5);

    // 6. Chart Data
    const categoryMap: { [key: string]: number } = {};
    const allExpenses = await Transaction.find({ userId, type: 'expense' });
    allExpenses.forEach(tx => {
       const cat = tx.category || 'Other';
       categoryMap[cat] = (categoryMap[cat] || 0) + tx.amount;
    });
    const chartData = Object.keys(categoryMap).map(cat => ({
      label: cat,
      value: categoryMap[cat],
      color: getColorForCategory(cat)
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    return NextResponse.json({
      accounts, // <--- NEW: Sending the list of accounts to the frontend
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      portfolioValue,
      recentTransactions,
      chartData
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

function getColorForCategory(category: string) {
  const map: any = { 'Food & Dining': '#ef4444', 'Transport': '#f97316', 'Shopping': '#8b5cf6', 'Bills': '#3b82f6', 'Entertainment': '#ec4899', 'Healthcare': '#10b981', 'Education': '#eab308' };
  return map[category] || '#6b7280'; 
}