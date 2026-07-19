import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api';

export async function GET(req: Request, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email } = await params;
    const res = await fetch(`${BACKEND_URL}/api/founders/profile/${email}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
