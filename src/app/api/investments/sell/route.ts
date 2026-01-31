// src/app/api/investments/sell/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Investment from '@/lib/models/Investment';
import Account from '@/lib/models/Account';
import { verifyToken } from '@/lib/auth';
import { getCurrentPrice } from '@/lib/market';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const { investmentId, quantityToSell, accountId } = body;

    // 1. Fetch Investment
    const investment = await Investment.findOne({ _id: investmentId, userId: decoded.userId });
    if (!investment) return NextResponse.json({ message: 'Investment not found' }, { status: 404 });

    // 2. Validate Quantity
    if (quantityToSell > investment.quantity) {
      return NextResponse.json({ message: 'Cannot sell more than you own' }, { status: 400 });
    }

    // 3. Get LIVE Price for Payout Calculation
    let currentPrice = await getCurrentPrice(investment.symbol, investment.type);
    
    // Fallback if API fails
    if (!currentPrice || currentPrice === 0) {
       currentPrice = investment.pricePerShare; 
    }

    const payoutAmount = currentPrice * Number(quantityToSell);

    // 4. DEPOSIT Funds to Account (Checking/Savings)
    // This receives the FULL Payout (Cost + Profit)
    const account = await Account.findOne({ _id: accountId, userId: decoded.userId });
    if (!account) return NextResponse.json({ message: 'Deposit account not found' }, { status: 404 });

    await Account.findByIdAndUpdate(accountId, { 
      $inc: { balance: payoutAmount } 
    });

    // 5. UPDATE "Investment Portfolio" Sync Account (The FIX)
    // Only remove the ORIGINAL COST of the shares sold.
    // This ensures the portfolio balance tracks "Money Invested" and doesn't go negative if you profit.
    const costBasisRemoved = investment.pricePerShare * Number(quantityToSell);

    await Account.findOneAndUpdate(
      { userId: decoded.userId, name: 'Investment Portfolio' },
      { $inc: { balance: -costBasisRemoved } } // <--- FIXED HERE
    );

    // 6. UPDATE or DELETE Investment
    if (Number(quantityToSell) === investment.quantity) {
      // Sold everything
      await Investment.findByIdAndDelete(investmentId);
    } else {
      // Partial Sell
      await Investment.findByIdAndUpdate(investmentId, {
        $inc: { quantity: -quantityToSell }
      });
    }

    return NextResponse.json({ message: 'Sold successfully', payout: payoutAmount });

  } catch (error) {
    console.error('Sell Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}