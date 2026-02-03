import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    
    // 🛡️ FIX: Add Null Check for decoded token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
        return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const transactions = await Transaction.find({ userId: decoded.userId }).sort({ date: 1 });

    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(tx => {
        if (tx.type === 'income') totalIncome += Math.abs(tx.amount);
        else totalExpenses += Math.abs(tx.amount);
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

    const monthlyMap = new Map();
    transactions.forEach(tx => {
        const date = new Date(tx.date);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyMap.has(key)) monthlyMap.set(key, { name: key, income: 0, expense: 0 });
        
        const entry = monthlyMap.get(key);
        if (tx.type === 'income') entry.income += Math.abs(tx.amount);
        else entry.expense += Math.abs(tx.amount);
    });

    const monthlyData = Array.from(monthlyMap.values());

    const categoryMap = new Map();
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
        const cat = tx.category || 'Other';
        if (!categoryMap.has(cat)) categoryMap.set(cat, 0);
        categoryMap.set(cat, categoryMap.get(cat) + Math.abs(tx.amount));
    });

    const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    
    const spendingByCategory = Array.from(categoryMap.entries())
        .map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value); 

    return NextResponse.json({
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        monthlyData,
        spendingByCategory
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}