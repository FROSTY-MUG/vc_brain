import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    if (!query) {
      return NextResponse.json({ results: [], count: 0 });
    }
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/py-api/sourcing/crunchbase/autocomplete?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Crunchbase autocomplete' }, { status: 500 });
  }
}
