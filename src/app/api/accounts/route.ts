// src/app/api/accounts/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/lib/models/Account';
import { verifyToken } from '@/lib/auth';

// GET ... (Keep your existing GET function)
export async function GET(req: Request) {
  // ... (Keep existing code)
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });

    await connectToDatabase();
    const accounts = await Account.find({ userId: decoded.userId });
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// POST - Update this part!
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    
    await connectToDatabase();
    const body = await req.json();

    // Create the account
    const newAccount = await Account.create({
      userId: decoded.userId,
      name: body.name,
      type: body.type,
      balance: Number(body.balance)
    });

    return NextResponse.json(newAccount, { status: 201 });

  } catch (error: any) {
    // LOG THE REAL ERROR TO YOUR TERMINAL
    console.error("❌ Account Creation Failed:", error); 
    
    // SEND THE REAL ERROR MESSAGE TO THE FRONTEND
    return NextResponse.json({ 
      message: error.message || 'Server Error' 
    }, { status: 500 });
  }
}