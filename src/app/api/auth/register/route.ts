import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    await connectToDatabase();

    // 1. Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 422 });
    }

    // 2. Create the User ONLY (NO SEED DATA HERE)
    const hashedPassword = await hashPassword(password);
    
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 3. Generate Token for Auto-Login
    const token = generateToken(newUser._id.toString());

    return NextResponse.json({ 
      message: 'Account created successfully',
      token,
      user: { name: newUser.name, email: newUser.email }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Registration Error:", error);
    if (error.code === 11000) {
       return NextResponse.json({ message: 'User already exists' }, { status: 422 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}