import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
const { Paynow } = require('paynow');

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { amount, email, customerName, phone, deliveryAddress, deliveryMethod, deliveryFee, items } = body;

    // We will call the Spring Boot backend to create the Order in PENDING_PAYMENT state
    const orderPayload = {
      source: 'ONLINE',
      status: 'PENDING_PAYMENT',
      customerName: customerName,
      customerEmail: email,
      customerPhone: phone,
      deliveryAddress: deliveryAddress,
      deliveryMethod: deliveryMethod,
      deliveryFee: deliveryFee || 0.0,
      total: amount,
      subtotal: amount - (deliveryFee || 0.0),
      items: items,
      giftCards: body.giftCards || []
    };

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const createOrderResponse = await fetch(`${backendUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    if (!createOrderResponse.ok) {
      throw new Error('Failed to create order in backend');
    }

    const order = await createOrderResponse.json();
    const orderRef = `ORD-${order.id}`;

    // Test credentials fallback if env vars are missing
    const integrationId = process.env.PAYNOW_INTEGRATION_ID || '12345';
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || 'test-key-123';
    
    // Initialize Paynow
    let paynow = new Paynow(integrationId, integrationKey);
    
    // Set URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    paynow.resultUrl = `${baseUrl}/api/paynow/result`;
    paynow.returnUrl = `${baseUrl}/checkout/success?orderRef=${orderRef}`;

    // Create payment
    let payment = paynow.createPayment(orderRef, email);
    payment.add("RedAvo Activewear Order", amount);

    // If using placeholder credentials, just return a mock URL
    if (integrationId === '12345') {
       return NextResponse.json({ 
           redirectUrl: `${baseUrl}/checkout/success?orderRef=${orderRef}&mock=true`,
           orderId: order.id
       });
    }

    // Send to Paynow
    const response = await paynow.send(payment);

    if (response.success) {
      // Get the redirect URL to send the user to Paynow
      return NextResponse.json({ redirectUrl: response.redirectUrl, orderId: order.id });
    }

    return NextResponse.json({ error: "Payment initiation failed", details: response.error }, { status: 400 });
  } catch (error) {
    console.error('PayNow Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
