import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { rateLimit } from '@/lib/rateLimit';

const sanitize = (str) => String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

    // Configure the SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use 'gmail' as default, this works for Google Workspace as well.
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Setup email data
    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_USER}>`, // The sender address (must be the authenticated user for Gmail)
      replyTo: email, // Set the reply-to to the person filling out the form
      to: process.env.SMTP_USER, // Send it to yourself
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${sanitize(name)}</p>
        <p><strong>Email:</strong> ${sanitize(email)}</p>
        <br/>
        <p><strong>Message:</strong></p>
        <p>${sanitize(message).replace(/\n/g, '<br/>')}</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
