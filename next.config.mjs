/** @type {import('next').NextConfig} */
const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  'https://hassa.keydevs.pk';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: `${API_BASE_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${API_BASE_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
