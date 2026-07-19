import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    if (!query) {
      return NextResponse.json({ results: [], count: 0 });
    }
    
    const res = await fetch(`${BACKEND_URL}/api/sourcing/crunchbase/autocomplete?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Crunchbase autocomplete' }, { status: 500 });
  }
}
