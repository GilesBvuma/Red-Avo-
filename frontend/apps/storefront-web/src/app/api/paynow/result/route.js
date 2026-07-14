import { NextResponse } from 'next/server';
const { Paynow } = require('paynow');

export async function POST(request) {
  try {
    // PayNow sends webhook data as x-www-form-urlencoded
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    // In production, you would verify the Paynow hash here to ensure authenticity.
    
    // The reference Paynow sends back is what we sent (e.g., ORD-15)
    const reference = data.reference;
    if (!reference || !reference.startsWith('ORD-')) {
       return NextResponse.json({ error: 'Invalid reference' }, { status: 400 });
    }
    
    const orderId = reference.split('-')[1];

    if (data.status === 'Paid') {
      // Confirm the order in the Spring Boot backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${backendUrl}/orders/${orderId}/confirm`, {
        method: 'POST'
      });

      if (!response.ok) {
        console.error('Failed to update order status in backend');
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
