import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/lib/models/Account';
import Transaction from '@/lib/models/Transaction';
import Investment from '@/lib/models/Investment';
import { verifyToken } from '@/lib/auth';
import { generateHealthReport } from '@/lib/financial-health'; 

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).userId) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    const userId = (decoded as any).userId;

    await connectToDatabase();

    const [accounts, transactions, investments] = await Promise.all([
      Account.find({ userId }),
      Transaction.find({ userId }).sort({ date: -1 }).limit(500),
      Investment.find({ userId })
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    // --- 1. PORTFOLIO RETURN CALCULATION ---
    let totalInvested = 0;
    let currentPortfolioValue = 0;

    investments.forEach((inv: any) => {
        const quantity = inv.quantity || 0;
        
        // 🔥 NOW THIS WILL WORK because avgCost is in the schema
        // If avgCost exists (Buy Price), use it. 
        // If not, fallback to pricePerShare (Current Price).
        const costPrice = inv.avgCost || inv.pricePerShare || 0;
        
        // Invested = Quantity * Buy Price
        const invested = quantity * costPrice;
        
        // Current Value = Database Total Value
        const current = inv.totalValue || (quantity * inv.pricePerShare) || 0;

        totalInvested += invested;
        currentPortfolioValue += current;
    });

    // Calculate Return %
    // If Invested = 100k, Current = 97k -> Return = -3%
    let portfolioReturn = 0;
    if (totalInvested > 0) {
        portfolioReturn = ((currentPortfolioValue - totalInvested) / totalInvested) * 100;
    }
    
    // Debug log to check the math in your server console
    console.log(`Invested: ${totalInvested}, Current: ${currentPortfolioValue}, Return: ${portfolioReturn}%`);

    // --- 2. EXPENSE CALCULATION ---
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentTx = transactions.filter((t: any) => {
        const d = new Date(t.date);
        return d >= thirtyDaysAgo; 
    });

    const activeTx = recentTx.length > 0 ? recentTx : transactions.slice(0, 50);

    const monthlyIncome = activeTx
        .filter((t: any) => t.type === 'income')
        .reduce((sum, t: any) => sum + t.amount, 0) || 0; 

    // Force expenses to be positive
    const rawExpense = activeTx
        .filter((t: any) => t.type === 'expense')
        .reduce((sum, t: any) => sum + t.amount, 0);
    const monthlyExpense = Math.abs(rawExpense); 

    const categoryMap: Record<string, number> = {};
    activeTx
        .filter((t: any) => t.type === 'expense')
        .forEach((t: any) => {
            const cleanAmount = Math.abs(t.amount); 
            categoryMap[t.category] = (categoryMap[t.category] || 0) + cleanAmount;
        });
    
    const topCategories = Object.entries(categoryMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

    const report = generateHealthReport({
        monthlyIncome,
        monthlyExpense,
        totalBalance,
        portfolioValue: currentPortfolioValue,
        portfolioReturn, 
        topCategories
    });

    return NextResponse.json(report);

  } catch (error: any) {
    console.error('Health Check Error:', error);
    return NextResponse.json({ message: 'Analysis Failed' }, { status: 500 });
  }
}