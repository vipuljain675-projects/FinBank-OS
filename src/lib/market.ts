// src/lib/market.ts

const CRYPTO_MAP: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'ADA': 'cardano'
};

export async function getCurrentPrice(symbol: string, type: string): Promise<number> {
  const cleanSymbol = symbol.toUpperCase();

  // 1. REAL-TIME CRYPTO (CoinGecko - Free, No Key)
  if (type === 'Crypto' && CRYPTO_MAP[cleanSymbol]) {
    try {
      const id = CRYPTO_MAP[cleanSymbol];
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      const data = await res.json();
      return data[id]?.usd || 0;
    } catch (error) {
      console.warn('Crypto fetch failed');
    }
  }

  // 2. REAL-TIME STOCKS (Finnhub API - Requires Key)
  // This is the "Innovative" part: Real Wall Street Data
  if (type === 'Stock' || type === 'ETF') {
    try {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey) {
        console.warn('Missing FINNHUB_API_KEY in .env.local');
        return 0; // Fallback to simulation if no key
      }

      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${cleanSymbol}&token=${apiKey}`);
      const data = await res.json();
      
      // Finnhub returns 'c' as the Current Price
      return data.c || 0;
    } catch (error) {
      console.error('Stock fetch failed:', error);
    }
  }

  return 0; // Triggers the fallback simulation in route.ts if all else fails
}