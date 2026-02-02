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

    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.c && data.c > 0 ? data.c : null; 
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

    const enrichedInvestments = await Promise.all(investments.map(async (inv) => {
      // 1. Try to get LIVE price
      let livePrice = await getLivePrice(inv.symbol);
      let currentPriceUSD = 0;

      // 2. 🧠 SMART LOGIC 🧠
      if (livePrice) {
          // CASE A: We got a live price from the API!
          if (inv.symbol.includes('.NS') || inv.symbol.includes('.BO')) {
              // API returns INR -> Convert to USD
              currentPriceUSD = livePrice / 86.5;
          } else {
              // API returns USD -> Keep as is
              currentPriceUSD = livePrice;
          }
      } else {
          // CASE B: API Failed (Market closed or Typo like TSC.NS)
          // We must use the stored price.
          // IMPORTANT: The stored price is ALREADY in USD. DO NOT DIVIDE IT.
          currentPriceUSD = inv.pricePerShare; 
      }

      const quantity = Number(inv.quantity);
      
      // 3. Calculate Totals (All in USD)
      const currentValue = currentPriceUSD * quantity;
      const costBasis = inv.pricePerShare * quantity; 
      
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return { 
        ...inv.toObject(), 
        currentPrice: currentPriceUSD, 
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

// POST: Add Investment (Kept same)
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

    const totalCostUSD = Number(quantity) * Number(pricePerShare);

    const fundingAccount = await Account.findOne({ _id: accountId, userId: decoded.userId });
    if (!fundingAccount || fundingAccount.balance < totalCostUSD) {
      return NextResponse.json({ message: 'Insufficient funds' }, { status: 400 });
    }

    await Account.findByIdAndUpdate(accountId, { $inc: { balance: -totalCostUSD } });

    await Account.findOneAndUpdate(
      { userId: decoded.userId, name: 'Investment Portfolio' },
      { $inc: { balance: totalCostUSD } },
      { upsert: true }
    );

    const newInv = await Investment.create({
      userId: decoded.userId,
      symbol: symbol.toUpperCase(),
      name,
      type,
      quantity,
      pricePerShare, 
      totalValue: totalCostUSD 
    });

    return NextResponse.json(newInv, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
  }
}