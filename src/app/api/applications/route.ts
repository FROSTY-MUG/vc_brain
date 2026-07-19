import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/applications/`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const res = await fetch(`${BACKEND_URL}/api/applications/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 });
  }
}
