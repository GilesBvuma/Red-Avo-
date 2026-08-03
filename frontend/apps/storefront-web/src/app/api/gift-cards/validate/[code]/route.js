import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/** GET /api/gift-cards/validate/[code] */
export async function GET(request, { params }) {
  try {
    const { code } = params;
    const res = await fetch(`${API_BASE}/gift-cards/validate/${encodeURIComponent(code)}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error('Gift card validate proxy error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
