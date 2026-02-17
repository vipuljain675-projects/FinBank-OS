import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/lib/models/Account';
import Transaction from '@/lib/models/Transaction';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.userId) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    
    await connectToDatabase();
    const body = await req.json();
    
    // NEW: receiving branchLocation from frontend
    const { fromAccountId, recipientName, bankName, accountNumber, amount, currency, branchLocation } = body;
    
    let finalAmountUSD = Number(amount);
    if (isNaN(finalAmountUSD) || finalAmountUSD <= 0) return NextResponse.json({ message: 'Invalid Amount' }, { status: 400 });

    if (currency === 'INR') finalAmountUSD = finalAmountUSD / 86.5;

    const account = await Account.findOne({ _id: fromAccountId, userId: decoded.userId });
    if (!account) return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    if (account.balance < finalAmountUSD) return NextResponse.json({ message: `Insufficient Balance` }, { status: 400 });

    await Account.findByIdAndUpdate(fromAccountId, { $inc: { balance: -finalAmountUSD } });

    const safeAccountNum = accountNumber ? accountNumber.slice(-4) : 'XXXX';
    const locationTag = branchLocation && !branchLocation.includes('Invalid') ? ` | ${branchLocation}` : '';

    const newTx = await Transaction.create({
      userId: decoded.userId,
      accountId: fromAccountId,
      name: `Transfer to ${recipientName}`, 
      amount: -finalAmountUSD, 
      type: 'expense',
      category: 'Transfer', 
      date: new Date(),
      status: 'completed',
      // Updated paymentMethod to include branch location
      paymentMethod: `Wire to ${bankName} (${safeAccountNum})${locationTag}`, 
      logo: `https://ui-avatars.com/api/?name=${recipientName.replace(/\s/g, '+')}&background=random`
    });

    return NextResponse.json({ success: true, transaction: newTx });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}