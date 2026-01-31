// src/app/api/investments/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Investment from '@/lib/models/Investment';
import Account from '@/lib/models/Account';
import { verifyToken } from '@/lib/auth';

// --- REAL MARKET DATA FETCHER ---
async function getLivePrice(symbol: string) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return null;

    // Fetch from Finnhub
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    // Finnhub returns 'c' as the Current Price
    return data.c || null; 
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}`, error);
    return null;
  }
}

// GET: Fetch investments with LIVE calculated returns
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });

    await connectToDatabase();
    
    const investments = await Investment.find({ userId: decoded.userId }).sort({ createdAt: -1 });

    // Calculate live values in parallel
    const enrichedInvestments = await Promise.all(investments.map(async (inv) => {
      // 1. Try to get LIVE price
      let currentPrice = await getLivePrice(inv.symbol);

      // 2. Fallback: If API fails or limit reached, use the price you bought at (so it doesn't crash)
      if (!currentPrice) {
         currentPrice = inv.pricePerShare;
      }

      const quantity = Number(inv.quantity);
      const buyPrice = Number(inv.pricePerShare);
      
      const currentValue = currentPrice * quantity;
      const costBasis = buyPrice * quantity;
      
      const gainLoss = currentValue - costBasis;
      
      // Prevent division by zero
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return { 
        ...inv.toObject(), 
        currentPrice,     
        currentValue,     
        gainLoss,         
        gainLossPercent   
      };
    }));

    return NextResponse.json(enrichedInvestments);
  } catch (error) {
    console.error("Investment Fetch Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// POST: Add Investment (Kept same as before)
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    
    await connectToDatabase();
    const body = await req.json();

    const { symbol, name, type, quantity, pricePerShare, accountId } = body;
    
    if (!accountId) return NextResponse.json({ message: 'Select an account' }, { status: 400 });

    const totalCost = Number(quantity) * Number(pricePerShare);

    const fundingAccount = await Account.findOne({ _id: accountId, userId: decoded.userId });
    if (!fundingAccount || fundingAccount.balance < totalCost) {
      return NextResponse.json({ message: 'Insufficient funds' }, { status: 400 });
    }

    await Account.findByIdAndUpdate(accountId, { $inc: { balance: -totalCost } });

    // Sync to "Investment Portfolio" account for tracking
    await Account.findOneAndUpdate(
      { userId: decoded.userId, name: 'Investment Portfolio' },
      { $inc: { balance: totalCost } },
      { upsert: true }
    );

    const newInv = await Investment.create({
      userId: decoded.userId,
      symbol: symbol.toUpperCase(),
      name,
      type,
      quantity,
      pricePerShare,
      totalValue: totalCost 
    });

    return NextResponse.json(newInv, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
  }
}