// src/lib/market.ts - COMPLETE FIXED VERSION

const CRYPTO_MAP: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'BTCUSDT': 'bitcoin',
  'ETH': 'ethereum',
  'ETHUSDT': 'ethereum',
  'SOL': 'solana',
  'SOLUSDT': 'solana',
  'DOGE': 'dogecoin',
  'DOGEUSDT': 'dogecoin',
  'ADA': 'cardano',
  'ADAUSDT': 'cardano',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'XRP': 'ripple'
};

// Main function - tries multiple APIs
export async function getCurrentPrice(symbol: string, type: string): Promise<number> {
  const cleanSymbol = symbol.toUpperCase();

  // 1. CRYPTO - Use CoinGecko (Free, No Key, Reliable)
  if (type === 'Crypto') {
    const cryptoPrice = await getCryptoPrice(cleanSymbol);
    if (cryptoPrice && cryptoPrice > 0) return cryptoPrice;
  }

  // 2. STOCKS - Try cascading APIs
  if (type === 'Stock' || type === 'ETF') {
    // Try Yahoo Finance first (Free, No Key, Supports ALL Markets)
    let price = await getYahooPrice(cleanSymbol);
    if (price && price > 0) return price;

    // Fallback to Finnhub (Good for US stocks)
    price = await getFinnhubPrice(cleanSymbol);
    if (price && price > 0) return price;

    // Fallback to Alpha Vantage (Limited but reliable)
    if (cleanSymbol.includes('.NS') || cleanSymbol.includes('.BO')) {
      price = await getAlphaVantagePrice(cleanSymbol);
      if (price && price > 0) return price;
    }
  }

  return 0; // All APIs failed
}

// CRYPTO: CoinGecko API (Free, No Key)
async function getCryptoPrice(symbol: string): Promise<number> {
  try {
    const baseSymbol = symbol.replace('USDT', '').replace('USD', '');
    const coinId = CRYPTO_MAP[baseSymbol];
    
    if (!coinId) {
      console.log(`❌ Crypto ${symbol} not found in CRYPTO_MAP`);
      return 0;
    }

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { next: { revalidate: 60 } } // Cache for 1 minute
    );
    
    if (!res.ok) return 0;
    
    const data = await res.json();
    const price = data[coinId]?.usd;
    
    if (price && price > 0) {
      console.log(`✅ CoinGecko: ${symbol} = $${price}`);
      return price;
    }
    
    return 0;
  } catch (error) {
    console.error(`CoinGecko failed for ${symbol}:`, error);
    return 0;
  }
}

// STOCK: Yahoo Finance API (Free, No Key, Best for All Markets)
async function getYahooPrice(symbol: string): Promise<number> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { 
        next: { revalidate: 60 },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!res.ok) {
      console.log(`❌ Yahoo Finance: ${symbol} - HTTP ${res.status}`);
      return 0;
    }
    
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    
    if (price && price > 0) {
      console.log(`✅ Yahoo Finance: ${symbol} = ₹${price}`);
      return price;
    }
    
    return 0;
  } catch (error) {
    console.error(`Yahoo Finance failed for ${symbol}:`, error);
    return 0;
  }
}

// STOCK: Finnhub API (Requires Key, Good for US Stocks)
async function getFinnhubPrice(symbol: string): Promise<number> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      console.log('⚠️ FINNHUB_API_KEY not set');
      return 0;
    }

    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    
    if (!res.ok) {
      console.log(`❌ Finnhub: ${symbol} - HTTP ${res.status}`);
      return 0;
    }
    
    const data = await res.json();
    const price = data.c;
    
    if (price && price > 0) {
      console.log(`✅ Finnhub: ${symbol} = $${price}`);
      return price;
    }
    
    return 0;
  } catch (error) {
    console.error(`Finnhub failed for ${symbol}:`, error);
    return 0;
  }
}

// STOCK: Alpha Vantage API (Limited 25/day, Indian Stocks)
async function getAlphaVantagePrice(symbol: string): Promise<number> {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_KEY;
    if (!apiKey) {
      console.log('⚠️ ALPHA_VANTAGE_KEY not set');
      return 0;
    }

    // Convert TCS.NS -> TCS.NSE for Alpha Vantage
    const cleanSymbol = symbol.replace('.NS', '.NSE').replace('.BO', '.BSE');
    
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    
    if (!res.ok) {
      console.log(`❌ Alpha Vantage: ${symbol} - HTTP ${res.status}`);
      return 0;
    }
    
    const data = await res.json();
    
    // Check for rate limit
    if (data['Note'] && data['Note'].includes('premium')) {
      console.log('⚠️ Alpha Vantage rate limit hit (25/day)');
      return 0;
    }
    
    const price = parseFloat(data['Global Quote']?.['05. price']);
    
    if (price && price > 0) {
      console.log(`✅ Alpha Vantage: ${symbol} = ₹${price}`);
      return price;
    }
    
    return 0;
  } catch (error) {
    console.error(`Alpha Vantage failed for ${symbol}:`, error);
    return 0;
  }
}