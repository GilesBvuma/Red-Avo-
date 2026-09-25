import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build remotePatterns from env vars with a safe fallback.
// We also hardcode localhost ports so local dev always works
// regardless of what NEXT_PUBLIC_MEDIA_URL is set to.
function safeOriginToPattern(origin) {
  try {
    const { protocol, hostname, port } = new URL(origin);
    return { protocol: protocol.replace(':', ''), hostname, ...(port && { port }) };
  } catch {
    return null;
  }
}

const envPatterns = [
  process.env.NEXT_PUBLIC_API_URL   || 'http://localhost:8080',
  process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:3000',
]
  .map(safeOriginToPattern)
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    // In dev, bypass the image optimizer entirely so localhost images
    // aren't blocked by Next.js 15's private-IP SSRF protection.
    unoptimized: process.env.NODE_ENV === 'development',
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Always allow local dev hosts so images work regardless of env vars
      { protocol: 'http', hostname: 'localhost', port: '3000' },
      { protocol: 'http', hostname: 'localhost', port: '3001' },
      { protocol: 'http', hostname: 'localhost', port: '8080' },
      // Production hosts from env vars
      ...envPatterns,
      // Named production hosts
      { protocol: 'https', hostname: 'pos.redavo.co.zw' },
      { protocol: 'https', hostname: 'redavowear.com' },
      { protocol: 'https', hostname: 'pos.redavowear.com' },
      { protocol: 'https', hostname: 'storefront.redavowear.com' },
      { protocol: 'https', hostname: 'placehold.co' },
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
