/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images from backend upload directory
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080' },
    ],
  },
};

export default nextConfig;
