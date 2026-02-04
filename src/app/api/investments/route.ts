// app/api/investments/route.ts - COMPLETE DUAL P&L SYSTEM (Fixes TCS -0.02% vs Google -7%)
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Investment from '@/lib/models/Investment';
import Account from '@/lib/models/Account';
import { verifyToken } from '@/lib/auth';
import { getCurrentPrice, getDailyChangePercent } from '@/lib/market';

// GET: Fetch investments with LIVE calculated returns (POSITION + DAILY P&L)
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
      // 1. Get LIVE price from market APIs
      let livePrice = await getCurrentPrice(inv.symbol, inv.type);
      let currentPriceUSD = 0;
      let usingLiveData = false;

      // 2. 🧠 SMART CONVERSION LOGIC 🧠
      if (livePrice && livePrice > 0) {
        usingLiveData = true;
        
        // Indian stocks: API returns INR → Convert to USD
        if (inv.symbol.includes('.NS') || inv.symbol.includes('.BO')) {
          currentPriceUSD = livePrice / 86.5;
          console.log(`💱 ${inv.symbol}: ₹${livePrice.toFixed(2)} → $${currentPriceUSD.toFixed(2)}`);
        } else {
          // US stocks/crypto: Already USD
          currentPriceUSD = livePrice;
          console.log(`💵 ${inv.symbol}: $${livePrice.toFixed(2)}`);
        }
      } else {
        // Fallback to stored price (ALREADY USD)
        currentPriceUSD = inv.pricePerShare;
        usingLiveData = false;
        console.log(`⚠️ ${inv.symbol}: Using stored price $${currentPriceUSD.toFixed(2)}`);
      }

      const quantity = Number(inv.quantity);
      
      // 3. POSITION P&L (Your actual gain/loss since purchase)
      const currentValueUSD = currentPriceUSD * quantity;
      const costBasisUSD = inv.pricePerShare * quantity; 
      const positionGainLoss = currentValueUSD - costBasisUSD;
      const positionGainLossPercent = costBasisUSD > 0 ? (positionGainLoss / costBasisUSD) * 100 : 0;

      // 🔥 4. DAILY P&L (Market change today - MATCHES GOOGLE FINANCE)
      const dailyChangePercent = await getDailyChangePercent(inv.symbol, inv.type);

      console.log(`📊 ${inv.symbol}:`);
      console.log(`   Cost: $${costBasisUSD.toFixed(2)} → Live: $${currentValueUSD.toFixed(2)}`);
      console.log(`   Your P&L: ${positionGainLossPercent >= 0 ? '+' : ''}${positionGainLossPercent.toFixed(2)}%`);
      console.log(`   Daily: ${dailyChangePercent >= 0 ? '+' : ''}${dailyChangePercent.toFixed(2)}%`);

      return { 
        ...inv.toObject(),
        currentPrice: currentPriceUSD,
        currentValue: currentValueUSD,
        positionGainLoss,           // Your actual $ gain/loss
        positionGainLossPercent,    // Your actual % gain/loss  
        dailyChangePercent,         // 🔥 GOOGLE FINANCE MATCH
        usingLiveData
      };
    }));

    return NextResponse.json(enrichedInvestments);
  } catch (error) {
    console.error("Investment Fetch Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// POST: Add Investment (UNCHANGED - WORKS PERFECTLY)
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

    // Check funding account balance
    const fundingAccount = await Account.findOne({ _id: accountId, userId: decoded.userId });
    if (!fundingAccount || fundingAccount.balance < totalCostUSD) {
      return NextResponse.json({ message: 'Insufficient funds' }, { status: 400 });
    }

    // Deduct from funding account
    await Account.findByIdAndUpdate(accountId, { $inc: { balance: -totalCostUSD } });

    // Sync Investment Portfolio account
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
      pricePerShare, // Already USD from frontend
      totalValue: totalCostUSD 
    });

    console.log(`✅ Investment added: ${symbol} x${quantity} @ $${pricePerShare}`);
    return NextResponse.json(newInv, { status: 201 });

  } catch (error: any) {
    console.error('Investment POST Error:', error);
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
  }
}
