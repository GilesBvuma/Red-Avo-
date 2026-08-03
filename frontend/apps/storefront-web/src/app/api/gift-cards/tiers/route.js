import { NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || 'http://localhost:8080/api';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/gift-cards/tiers`);
    if (!res.ok) {
      throw new Error(`Backend responded with ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json({ error: 'Failed to fetch gift card tiers' }, { status: 500 });
  }
}
