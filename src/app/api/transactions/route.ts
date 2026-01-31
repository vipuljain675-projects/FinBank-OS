import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import Account from '@/lib/models/Account';
import Card from '@/lib/models/Card'; 
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).userId) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    
    await connectToDatabase();
    
    const transactions = await Transaction.find({ userId: (decoded as any).userId })
      .sort({ date: -1 })
      .populate('cardId', 'brand last4') 
      .populate('accountId', 'name');

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).userId) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    
    await connectToDatabase();
    const body = await req.json();

    const { name, amount, type, category, accountId, cardId, date } = body;
    const userId = (decoded as any).userId;

    let finalAccountId = accountId;

    // --- LOGIC: IF PAYING WITH CARD ---
    if (cardId) {
       const card = await Card.findOne({ _id: cardId, userId });
       
       if (!card) {
         return NextResponse.json({ message: 'Card not found' }, { status: 404 });
       }

       // 1. Check if Card is Frozen
       if (card.status === 'Frozen') {
         return NextResponse.json({ message: '❌ Declined: Card is Frozen' }, { status: 403 });
       }

       // 2. CHECK CUMULATIVE MONTHLY LIMIT (Updated Logic)
       const now = new Date();
       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
       
       // Get previous spending on this card for this month
       const previousTransactions = await Transaction.find({
          cardId: card._id,
          date: { $gte: startOfMonth }
       });

       const currentSpent = previousTransactions.reduce((sum, t) => sum + t.amount, 0);
       const totalAfterThis = currentSpent + Number(amount);

       if (totalAfterThis > card.monthlyLimit) {
         const remaining = card.monthlyLimit - currentSpent;
         return NextResponse.json({ message: `❌ Declined: Exceeds monthly limit. You only have $${remaining} left.` }, { status: 403 });
       }

       // 3. Check Linked Account
       if (!card.accountId) {
         return NextResponse.json({ message: '❌ Error: This card is not linked to any account.' }, { status: 400 });
       }

       finalAccountId = card.accountId;
    }

    // --- FINAL VALIDATION ---
    if (!name || !amount || !type || !finalAccountId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Create Transaction
    const newTransaction = await Transaction.create({
      userId,
      name,
      amount: Number(amount),
      type,
      category,
      accountId: finalAccountId,
      cardId: cardId || null, 
      date: date || new Date(),
    });

    // Update Account Balance
    const adjustment = type === 'income' ? Number(amount) : -Number(amount);
    
    await Account.findByIdAndUpdate(
      finalAccountId,
      { $inc: { balance: adjustment } }
    );

    return NextResponse.json(newTransaction, { status: 201 });

  } catch (error) {
    console.error('Transaction Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}