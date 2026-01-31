import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/lib/models/Account';
import Transaction from '@/lib/models/Transaction';
import Investment from '@/lib/models/Investment';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });

    await connectToDatabase();

    // Delete Accounts, Transactions, and Investments for this user
    await Account.deleteMany({ userId: decoded.userId });
    await Transaction.deleteMany({ userId: decoded.userId });
    await Investment.deleteMany({ userId: decoded.userId });

    return NextResponse.json({ message: 'All financial data reset' });
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}