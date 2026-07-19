import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/founders/`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
