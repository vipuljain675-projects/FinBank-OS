// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Find user but exclude password
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}