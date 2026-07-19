import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email } = await params;
    const res = await fetch(`http://localhost:8000/api/founders/profile/${email}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
