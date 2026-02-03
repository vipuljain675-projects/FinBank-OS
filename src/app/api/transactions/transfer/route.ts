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
    
    // 🛡️ Fix TypeScript Error: Handle null decoded token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
        return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    }
    
    await connectToDatabase();
    const body = await req.json();
    
    const { fromAccountId, recipientName, bankName, accountNumber, amount, currency } = body;
    
    // Safety check for Amount
    let finalAmountUSD = Number(amount);
    if (isNaN(finalAmountUSD) || finalAmountUSD <= 0) {
        return NextResponse.json({ message: 'Invalid Amount' }, { status: 400 });
    }

    // Convert to USD for storage if sent in INR
    if (currency === 'INR') {
        finalAmountUSD = finalAmountUSD / 86.5;
    }

    // Check Balance
    const account = await Account.findOne({ _id: fromAccountId, userId: decoded.userId });
    
    if (!account) {
         return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }

    if (account.balance < finalAmountUSD) {
        return NextResponse.json({ message: `Insufficient Balance` }, { status: 400 });
    }

    // Deduct Money
    await Account.findByIdAndUpdate(fromAccountId, { 
        $inc: { balance: -finalAmountUSD } 
    });

    // Generate Receipt
    const safeAccountNum = accountNumber ? accountNumber.slice(-4) : 'XXXX';
    const safeBankName = bankName || 'Bank Transfer';

    const newTx = await Transaction.create({
      userId: decoded.userId,
      accountId: fromAccountId,
      name: `Transfer to ${recipientName}`, 
      amount: -finalAmountUSD, 
      type: 'expense',
      category: 'Transfer', 
      date: new Date(),
      status: 'completed', // ✅ FIXED: Must be lowercase 'completed'
      paymentMethod: `Wire to ${safeBankName} (${safeAccountNum})`, 
      logo: `https://ui-avatars.com/api/?name=${recipientName.replace(/\s/g, '+')}&background=random`
    });

    return NextResponse.json({ success: true, transaction: newTx });

  } catch (error: any) {
    console.error("Transfer Error:", error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}