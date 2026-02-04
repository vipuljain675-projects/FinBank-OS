// app/api/quote/route.ts - BULLETPROOF LIVE PRICES
import { NextResponse } from 'next/server';
import { getCurrentPrice } from '@/lib/market';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol')?.toUpperCase();
  const type = searchParams.get('type') || 'Stock';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
  }

  try {
    console.log(`🔍 Fetching quote for ${symbol} (${type})`);
    
    // Use the same battle-tested market logic
    const price = await getCurrentPrice(symbol, type);
    
    if (price && price > 0) {
      // Auto-detect currency based on symbol
      const currency = symbol.includes('.NS') || symbol.includes('.BO') ? 'INR' : 'USD';
      
      return NextResponse.json({ 
        symbol, 
        price, 
        shortName: symbol,
        currency,
        source: 'Multi-API'
      });
    }
    
    return NextResponse.json({ 
      error: 'Price unavailable', 
      symbol,
      fallbackPrice: 0 
    }, { status: 503 });
    
  } catch (error) {
    console.error(`Quote error ${symbol}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch quote', 
      symbol 
    }, { status: 500 });
  }
}
