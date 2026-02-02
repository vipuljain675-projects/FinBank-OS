import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let symbol = searchParams.get('symbol')?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ message: 'Symbol is required' }, { status: 400 });
  }

  // 1. 🧠 SMART MAPPING: Convert standard symbols to Google Finance format
  // Google expects: "SYMBOL:EXCHANGE" (e.g., "TCS:NSE" or "MSFT:NASDAQ")
  let googleSymbol = symbol;
  let exchange = "NASDAQ"; // Default to US

  if (symbol.endsWith('.NS')) {
    googleSymbol = symbol.replace('.NS', '');
    exchange = "NSE";
  } else if (symbol.endsWith('.BO')) {
    googleSymbol = symbol.replace('.BO', '');
    exchange = "BOM"; // BSE
  } else {
    // For US stocks, Google usually figures it out, but specifying exchange helps.
    // We'll try NASDAQ first.
    exchange = "NASDAQ"; 
  }

  const targetUrl = `https://www.google.com/finance/quote/${googleSymbol}:${exchange}`;

  try {
    // 2. FETCH THE PAGE (Act like a real browser)
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = await response.text();

    // 3. 🕵️‍♂️ SCRAPE THE PRICE (Regex to find the big price number)
    // Google Finance consistently uses class "YMlKec fxKbKc" for the main price.
    const priceMatch = html.match(/<div class="YMlKec fxKbKc">([^<]+)<\/div>/);
    const nameMatch = html.match(/<div class="zzDege">([^<]+)<\/div>/); // Class for company name

    if (!priceMatch) {
      // Fallback: Try NYSE if NASDAQ failed (for US stocks)
      if (exchange === "NASDAQ") {
        return fetchRetry(googleSymbol, "NYSE");
      }
      return NextResponse.json({ message: 'Stock data not found on Google Finance' }, { status: 404 });
    }

    // Clean the price (remove currency symbols like ₹ or $)
    let rawPrice = priceMatch[1].replace(/[^0-9.]/g, ''); 
    const price = parseFloat(rawPrice);
    const name = nameMatch ? nameMatch[1] : symbol;

    return NextResponse.json({ 
      symbol: symbol,
      price: price, 
      shortName: name,
      currency: exchange === "NSE" || exchange === "BOM" ? "INR" : "USD",
      source: "GoogleFinance"
    });

  } catch (error: any) {
    console.error(`Google Finance Error for ${symbol}:`, error);
    return NextResponse.json({ message: 'Failed to fetch quote', error: error.message }, { status: 500 });
  }
}

// Helper to retry with NYSE
async function fetchRetry(symbol: string, exchange: string) {
  try {
    const url = `https://www.google.com/finance/quote/${symbol}:${exchange}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const priceMatch = html.match(/<div class="YMlKec fxKbKc">([^<]+)<\/div>/);
    
    if (priceMatch) {
      const rawPrice = priceMatch[1].replace(/[^0-9.]/g, '');
      return NextResponse.json({ 
        symbol: symbol, 
        price: parseFloat(rawPrice), 
        shortName: symbol, 
        currency: "USD",
        source: "GoogleFinance"
      });
    }
  } catch (e) {}
  return NextResponse.json({ message: 'Stock not found' }, { status: 404 });
}