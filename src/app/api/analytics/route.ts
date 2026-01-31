// src/app/api/analytics/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });

    await connectToDatabase();

    // 1. Fetch All Transactions
    const transactions = await Transaction.find({ userId: decoded.userId }).sort({ date: 1 });

    // 2. Calculate Totals
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryMap: { [key: string]: number } = {};

    transactions.forEach(tx => {
      const amount = tx.amount || 0;
      
      if (tx.type === 'income') {
        totalIncome += amount;
      } else if (tx.type === 'expense') {
        totalExpenses += amount;
        
        // Track category spending for Pie Chart
        const cat = tx.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

    // 3. Prepare Chart Data (Top Spending Categories)
    const spendingByCategory = Object.keys(categoryMap)
      .map(cat => ({
        name: cat,
        value: categoryMap[cat],
        percent: totalExpenses > 0 ? ((categoryMap[cat] / totalExpenses) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value); // Highest first

    // 4. Monthly Trend Data (Simplified for Line Chart)
    // We group by "Year-Month" (e.g., "2026-01")
    const monthlyDataMap: any = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyDataMap[key]) monthlyDataMap[key] = { income: 0, expense: 0 };
      
      if (tx.type === 'income') monthlyDataMap[key].income += tx.amount;
      else monthlyDataMap[key].expense += tx.amount;
    });

    const monthlyTrends = Object.keys(monthlyDataMap).sort().map(key => ({
      month: key,
      ...monthlyDataMap[key]
    }));

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      spendingByCategory,
      monthlyTrends
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}