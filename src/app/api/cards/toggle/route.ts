import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Card from '@/lib/models/Card';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // TS Fix: Ensure decoded is valid
    if (!decoded || typeof decoded !== 'object' || !(decoded as any).userId) {
      return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    }
    const userId = (decoded as any).userId;
    
    await connectToDatabase();
    
    const body = await req.json().catch(() => ({}));
    const { cardId } = body;

    if (!cardId) return NextResponse.json({ message: 'Missing Card ID' }, { status: 400 });

    // 1. Check if card exists and get current status
    const card = await Card.findOne({ _id: cardId, userId });
    
    if (!card) {
      return NextResponse.json({ message: 'Card not found' }, { status: 404 });
    }

    const newStatus = card.status === 'Active' ? 'Frozen' : 'Active';

    // 2. CRITICAL FIX: Use updateOne instead of save()
    // This updates ONLY the status field and ignores missing 'accountId' on old cards.
    await Card.updateOne(
      { _id: cardId },
      { $set: { status: newStatus } }
    );

    console.log(`✅ Card ${cardId} updated to ${newStatus}`);

    return NextResponse.json({ 
      message: `Card ${newStatus === 'Active' ? 'unlocked' : 'frozen'}`, 
      status: newStatus 
    });

  } catch (error: any) {
    console.error('❌ SERVER CRASH (Toggle):', error.message);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}