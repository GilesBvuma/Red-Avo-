/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080' },
      { protocol: 'http', hostname: 'localhost', port: '3000' },
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
