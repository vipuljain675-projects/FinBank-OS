// src/app/api/quote/route.ts
import { NextResponse } from 'next/server';
import { getCurrentPrice } from '@/lib/market';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    if (!verifyToken(token)) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });

    // 2. Get Query Params (Symbol & Type)
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') || 'Stock';

    if (!symbol) return NextResponse.json({ message: 'Symbol required' }, { status: 400 });

    // 3. Fetch Live Price
    const price = await getCurrentPrice(symbol, type);
    
    return NextResponse.json({ price });

  } catch (error) {
    return NextResponse.json({ message: 'Error fetching price' }, { status: 500 });
  }
}