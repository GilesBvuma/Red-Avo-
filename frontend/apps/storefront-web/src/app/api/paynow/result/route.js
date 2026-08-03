import { NextResponse } from 'next/server';
import crypto from 'crypto';
const { Paynow } = require('paynow');

function verifyPaynowHash(data, integrationKey) {
  const { hash, ...fields } = data;
  const hashString = [
    fields.reference, fields.paynowreference, fields.amount, 
    fields.status, fields.pollurl, integrationKey
  ].join('').toUpperCase();
  const computed = crypto.createHash('sha512').update(hashString).digest('hex').toUpperCase();
  return computed === (hash || '').toUpperCase();
}

export async function POST(request) {
  try {
    // PayNow sends webhook data as x-www-form-urlencoded
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || 'test-key-123';
    
    if (!verifyPaynowHash(data, integrationKey)) {
      console.error('Invalid PayNow webhook hash', data);
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400 });
    }
    
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
