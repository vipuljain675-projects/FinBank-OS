// lib/market.ts - BULLETPROOF MULTI-API SYSTEM
const CRYPTO_MAP: { [key: string]: string } = {
  'BTC': 'bitcoin', 'BTCUSDT': 'bitcoin',
  'ETH': 'ethereum', 'ETHUSDT': 'ethereum',
  'SOL': 'solana', 'SOLUSDT': 'solana',
  'DOGE': 'dogecoin', 'DOGEUSDT': 'dogecoin',
  'ADA': 'cardano', 'ADAUSDT': 'cardano',
  'USDT': 'tether', 'BNB': 'binancecoin',
  'XRP': 'ripple'
};

export async function getCurrentPrice(symbol: string, type: string): Promise<number> {
  const cleanSymbol = symbol.toUpperCase();
  console.log(`💹 getCurrentPrice(${cleanSymbol}, ${type})`);

  // 1. CRYPTO - CoinGecko (Always works)
  if (type === 'Crypto') {
    const price = await getCryptoPrice(cleanSymbol);
    if (price > 0) return price;
  }

  // 2. STOCKS - Yahoo Finance (BEST for NSE/US, No Key)
  if (type === 'Stock' || type === 'ETF') {
    let price = await getYahooPrice(cleanSymbol);
    if (price > 0) return price;

    // Fallback 1: Finnhub
    price = await getFinnhubPrice(cleanSymbol);
    if (price > 0) return price;

    // Fallback 2: Alpha Vantage (Indian stocks)
    price = await getAlphaVantagePrice(cleanSymbol);
    if (price > 0) return price;
  }

  console.log(`❌ All APIs failed for ${cleanSymbol}`);
  return 0;
}

// 🟢 CRYPTO: CoinGecko (100% reliable)
async function getCryptoPrice(symbol: string): Promise<number> {
  try {
    const baseSymbol = symbol.replace(/USDT|USD/g, '');
    const coinId = CRYPTO_MAP[baseSymbol];
    if (!coinId) return 0;

    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    const data = await res.json();
    return data[coinId]?.usd || 0;
  } catch {
    return 0;
  }
}

// 🟢 STOCKS: Yahoo Finance (Works for TCS.NS, MSFT, NSE, NASDAQ)
async function getYahooPrice(symbol: string): Promise<number> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return 0;

    const data = await res.json();
    return parseFloat(data?.chart?.result?.[0]?.meta?.regularMarketPrice || '0');
  } catch {
    return 0;
  }
}

// 🟡 Finnhub Fallback
async function getFinnhubPrice(symbol: string): Promise<number> {
  try {
    const key = process.env.FINNHUB_API_KEY;
    if (!key) return 0;

    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`);
    const data = await res.json();
    return parseFloat(data.c || '0');
  } catch {
    return 0;
  }
}

// 🟡 Alpha Vantage Fallback (Indian stocks)
async function getAlphaVantagePrice(symbol: string): Promise<number> {
  try {
    const key = process.env.ALPHA_VANTAGE_KEY;
    if (!key) return 0;

    const cleanSymbol = symbol.replace('.NS', '.NSE').replace('.BO', '.BSE');
    const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${key}`);
    const data = await res.json();

    if (data['Note']) return 0; // Rate limited
    return parseFloat(data['Global Quote']?.['05. price'] || '0');
  } catch {
    return 0;
  }
}

// ADD THIS FUNCTION to your lib/market.ts
export async function getDailyChangePercent(symbol: string, type: string): Promise<number> {
  try {
    // Yahoo Finance daily change (matches Google Finance)
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!res.ok) return 0;
    
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    
    // regularMarketChangePercent = DAILY % change (exactly like Google)
    return parseFloat(meta?.regularMarketChangePercent || '0');
  } catch (error) {
    console.log(`Daily change failed for ${symbol}`);
    return 0;
  }
}
