import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://localhost:8000/api/messages/');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch('http://localhost:8000/api/messages/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
