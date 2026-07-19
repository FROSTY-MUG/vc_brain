import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch('http://localhost:8000/api/thesis/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    // Forward the backend status so callers can distinguish success from failure.
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save thesis' }, { status: 500 });
  }
}
