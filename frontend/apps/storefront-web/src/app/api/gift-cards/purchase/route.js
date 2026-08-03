import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/** POST /api/gift-cards/purchase — proxy to Spring Boot */
export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE}/gift-cards/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('Gift card purchase proxy error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
