import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/founders/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    // Forward the backend status so callers can distinguish success from failure.
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to onboard' }, { status: 500 });
  }
}
