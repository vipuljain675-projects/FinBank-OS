// app/api/investments/route.ts - COMPLETE FIXED VERSION
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Investment from '@/lib/models/Investment';
import Account from '@/lib/models/Account';
import { verifyToken } from '@/lib/auth';
import { getCurrentPrice } from '@/lib/market';

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
      // 1. Try to get LIVE price from market APIs
      let livePrice = await getCurrentPrice(inv.symbol, inv.type);
      let currentPriceUSD = 0;
      let usingLiveData = false;

      // 2. 🧠 SMART CONVERSION LOGIC 🧠
      if (livePrice && livePrice > 0) {
        usingLiveData = true;
        
        // Check if it's an Indian stock (API returns INR)
        if (inv.symbol.includes('.NS') || inv.symbol.includes('.BO')) {
          // Convert INR to USD
          currentPriceUSD = livePrice / 86.5;
          console.log(`💱 ${inv.symbol}: ₹${livePrice} → $${currentPriceUSD.toFixed(2)}`);
        } else {
          // Already in USD (US stocks, crypto)
          currentPriceUSD = livePrice;
          console.log(`💵 ${inv.symbol}: $${livePrice}`);
        }
      } else {
        // ❌ All APIs Failed - Use stored price as fallback
        // IMPORTANT: The stored price is ALREADY in USD
        currentPriceUSD = inv.pricePerShare;
        usingLiveData = false;
        console.log(`⚠️ ${inv.symbol}: Using stored price $${currentPriceUSD} (APIs failed)`);
      }

      const quantity = Number(inv.quantity);
      
      // 3. Calculate Returns (All in USD)
      const currentValue = currentPriceUSD * quantity;
      const costBasis = inv.pricePerShare * quantity; 
      
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      console.log(`📊 ${inv.symbol}: Cost $${costBasis.toFixed(2)} → Current $${currentValue.toFixed(2)} = ${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%`);

      return { 
        ...inv.toObject(), 
        currentPrice: currentPriceUSD,
        currentValue, 
        gainLoss,     
        gainLossPercent,
        usingLiveData // Flag to show if data is fresh
      };
    }));

    return NextResponse.json(enrichedInvestments);
  } catch (error) {
    console.error("Investment Fetch Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// POST: Add Investment
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

    // Check funding account has enough balance
    const fundingAccount = await Account.findOne({ _id: accountId, userId: decoded.userId });
    if (!fundingAccount || fundingAccount.balance < totalCostUSD) {
      return NextResponse.json({ message: 'Insufficient funds' }, { status: 400 });
    }

    // Deduct from funding account
    await Account.findByIdAndUpdate(accountId, { $inc: { balance: -totalCostUSD } });

    // Add to Investment Portfolio sync account
    await Account.findOneAndUpdate(
      { userId: decoded.userId, name: 'Investment Portfolio' },
      { $inc: { balance: totalCostUSD } },
      { upsert: true }
    );

    // Create investment record
    const newInv = await Investment.create({
      userId: decoded.userId,
      symbol: symbol.toUpperCase(),
      name,
      type,
      quantity,
      pricePerShare, // Already in USD from frontend
      totalValue: totalCostUSD 
    });

    console.log(`✅ Investment added: ${symbol} x${quantity} @ $${pricePerShare}`);

    return NextResponse.json(newInv, { status: 201 });

  } catch (error: any) {
    console.error('Investment POST Error:', error);
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
  }
}