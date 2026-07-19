import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://localhost:8000/api/kpis/');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
