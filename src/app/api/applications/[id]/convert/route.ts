import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await fetch(`http://localhost:8000/api/applications/${params.id}/convert`, {
      method: 'POST',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to convert' }, { status: 500 });
  }
}
