/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: 'https://hassa.keydevs.pk/api/:path*',
      },
    ];
  },
};

export default nextConfig;
