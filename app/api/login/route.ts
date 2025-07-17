import { NextResponse } from 'next/server';
import dbConnect from '../../../utils/db';
import User from '../../../models/User';

export async function POST(req: Request) {
  await dbConnect();
  const { username, password } = await req.json();
  const user = await User.findOne({ username, password });
  if (user) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }
} 