// src/app/api/goals/count/route.ts
import { NextResponse } from 'next/server';
import connectDb from '@/lib/db';
import Goal from '@/models/Goal';

export async function GET() {
  try {
    await connectDb();
    const count = await Goal.countDocuments();
    return NextResponse.json({ count });
  } catch (err) {
    console.error('Failed to fetch goal count:', err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
