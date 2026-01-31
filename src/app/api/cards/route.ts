import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Card from '@/lib/models/Card';
import Transaction from '@/lib/models/Transaction'; // Import Transaction model
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // FIX: TypeScript Null Check
    if (!decoded || typeof decoded !== 'object' || !(decoded as any).userId) {
      return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    }
    const userId = (decoded as any).userId;

    await connectToDatabase();
    
    // 1. Fetch Cards
    const cards = await Card.find({ userId })
      .populate('accountId', 'name') 
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch Card Transactions for THIS Month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await Transaction.find({
      userId,
      cardId: { $in: cards.map((c: any) => c._id) }, // Only fetch txs for these cards
      date: { $gte: startOfMonth }
    }).lean();

    // 3. Calculate "Spent" and "Remaining"
    const enhancedCards = cards.map((card: any) => {
      // Sum up transactions for this specific card
      const spentThisMonth = transactions
        .filter((t: any) => t.cardId.toString() === card._id.toString())
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      return {
        ...card,
        accountName: card.accountId ? card.accountId.name : 'Unlinked',
        spent: spentThisMonth,
        remaining: card.monthlyLimit - spentThisMonth // Calculated Field
      };
    });
    
    return NextResponse.json(enhancedCards);

  } catch (error: any) {
    console.error('❌ GET CARDS ERROR:', error.message);
    return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || typeof decoded !== 'object' || !(decoded as any).userId) {
      return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    }
    const userId = (decoded as any).userId;
    
    const body = await req.json();
    if (!body.accountId) return NextResponse.json({ message: 'Account ID is required' }, { status: 400 });

    await connectToDatabase();

    const newCard = await Card.create({
      userId,
      accountId: body.accountId,
      brand: body.brand || 'VISA',
      type: body.type || 'virtual',
      cardNumber: `**** **** **** ${body.last4}`,
      expiry: body.expiry,
      monthlyLimit: Number(body.monthlyLimit),
      color: body.brand === 'MASTERCARD' ? 'orange' : 'blue',
      status: 'Active'
    });

    return NextResponse.json(newCard, { status: 201 });
  } catch (error: any) {
    console.error('❌ CREATE CARD ERROR:', error.message);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}