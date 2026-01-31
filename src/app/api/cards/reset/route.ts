import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Card from '@/lib/models/Card';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });

    await connectToDatabase();

    // Delete Cards for this user
    await Card.deleteMany({ userId: decoded.userId });

    return NextResponse.json({ message: 'Cards reset' });
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}