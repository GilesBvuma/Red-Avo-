import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 3, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Forward the request to the Spring Boot backend
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const backendRes = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip
      },
      body: JSON.stringify({ name, email, message })
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      console.error('Backend contact error:', errText);
      return NextResponse.json({ error: 'Failed to send message to backend' }, { status: backendRes.status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to proxy contact message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
