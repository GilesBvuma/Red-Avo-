import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Image hosts derive from the same env vars the app is built with, so a
// deployment never needs to edit this file — set NEXT_PUBLIC_API_URL /
// NEXT_PUBLIC_MEDIA_URL and the allowed hosts follow. Defaults match local dev.
const imageOrigins = [
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:3000',
];

const remotePatterns = imageOrigins.map((origin) => {
  const { protocol, hostname, port } = new URL(origin);
  return { protocol: protocol.replace(':', ''), hostname, ...(port && { port }) };
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal self-contained server for Docker; traces from the workspace root
  // so shared packages/* are included. `next dev` is unaffected.
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    remotePatterns: [
      ...remotePatterns,
      { protocol: 'https', hostname: 'pos.redavo.co.zw' },
    ],
  },
  async rewrites() {
    const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:3000';
    return [
      {
        source: '/uploads/:path*',
        destination: `${mediaUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
