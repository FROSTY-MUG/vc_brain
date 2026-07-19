import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/applications/${params.id}/convert`, {
      method: 'POST',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to convert' }, { status: 500 });
  }
}
