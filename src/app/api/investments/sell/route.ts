// app/api/investments/sell/route.ts - FIXED VERSION (No Double Conversion!)
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

    console.log('\n========== SELL INVESTMENT ==========');
    console.log('Investment ID:', investmentId);
    console.log('Quantity to Sell:', quantityToSell);
    console.log('Deposit Account:', accountId);

    // 1. Fetch Investment
    const investment = await Investment.findOne({ _id: investmentId, userId: decoded.userId });
    if (!investment) return NextResponse.json({ message: 'Investment not found' }, { status: 404 });

    console.log('Stock:', investment.symbol);
    console.log('Type:', investment.type);
    console.log('Owned Quantity:', investment.quantity);
    console.log('Stored Price (USD):', investment.pricePerShare);

    // 2. Validate Quantity
    if (quantityToSell > investment.quantity) {
      return NextResponse.json({ message: 'Cannot sell more than you own' }, { status: 400 });
    }

    // 3. Get LIVE Price for Payout Calculation
    let currentPriceFromAPI = await getCurrentPrice(investment.symbol, investment.type);
    
    console.log('Raw API Price:', currentPriceFromAPI);

    // 4. 🚨 CRITICAL FIX: Convert API price to USD properly
    let currentPriceUSD = 0;

    if (currentPriceFromAPI && currentPriceFromAPI > 0) {
      // Check if it's an Indian stock
      if (investment.symbol.includes('.NS') || investment.symbol.includes('.BO')) {
        // API returns INR → Convert to USD
        currentPriceUSD = currentPriceFromAPI / 86.5;
        console.log(`💱 Indian Stock: API returned ₹${currentPriceFromAPI} → Converting to $${currentPriceUSD.toFixed(2)}`);
      } else {
        // US stock or crypto - already in USD
        currentPriceUSD = currentPriceFromAPI;
        console.log(`💵 US Stock/Crypto: API returned $${currentPriceUSD}`);
      }
    } else {
      // Fallback to stored price if API fails
      currentPriceUSD = investment.pricePerShare;
      console.log(`⚠️ API Failed - Using stored price: $${currentPriceUSD}`);
    }

    // 5. Calculate Payout in USD
    const payoutAmountUSD = currentPriceUSD * Number(quantityToSell);
    
    console.log('\n📊 PAYOUT CALCULATION:');
    console.log(`Current Price (USD): $${currentPriceUSD.toFixed(2)}`);
    console.log(`Quantity Selling: ${quantityToSell}`);
    console.log(`Payout Amount (USD): $${payoutAmountUSD.toFixed(2)}`);

    // 6. DEPOSIT Funds to Account
    const account = await Account.findOne({ _id: accountId, userId: decoded.userId });
    if (!account) return NextResponse.json({ message: 'Deposit account not found' }, { status: 404 });

    console.log(`\n💰 DEPOSITING TO: ${account.name}`);
    console.log(`Current Balance (USD): $${account.balance.toFixed(2)}`);
    console.log(`Adding (USD): $${payoutAmountUSD.toFixed(2)}`);
    console.log(`New Balance (USD): $${(account.balance + payoutAmountUSD).toFixed(2)}`);

    await Account.findByIdAndUpdate(accountId, { 
      $inc: { balance: payoutAmountUSD } 
    });

    // 7. UPDATE "Investment Portfolio" Sync Account
    // Only remove the ORIGINAL COST of the shares sold (in USD)
    const costBasisRemoved = investment.pricePerShare * Number(quantityToSell);

    console.log('\n📉 UPDATING INVESTMENT PORTFOLIO:');
    console.log(`Removing Cost Basis (USD): $${costBasisRemoved.toFixed(2)}`);

    await Account.findOneAndUpdate(
      { userId: decoded.userId, name: 'Investment Portfolio' },
      { $inc: { balance: -costBasisRemoved } }
    );

    // 8. UPDATE or DELETE Investment
    if (Number(quantityToSell) === investment.quantity) {
      // Sold everything
      console.log('🗑️ Deleting investment (sold all shares)');
      await Investment.findByIdAndDelete(investmentId);
    } else {
      // Partial Sell
      const remainingQuantity = investment.quantity - Number(quantityToSell);
      console.log(`📝 Updating investment (${remainingQuantity} shares remaining)`);
      await Investment.findByIdAndUpdate(investmentId, {
        $inc: { quantity: -quantityToSell }
      });
    }

    console.log('\n✅ SELL COMPLETED SUCCESSFULLY');
    console.log('========================================\n');

    return NextResponse.json({ 
      message: 'Sold successfully', 
      payout: payoutAmountUSD,
      details: {
        symbol: investment.symbol,
        quantitySold: quantityToSell,
        pricePerShare: currentPriceUSD,
        totalPayout: payoutAmountUSD
      }
    });

  } catch (error) {
    console.error('❌ SELL ERROR:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}