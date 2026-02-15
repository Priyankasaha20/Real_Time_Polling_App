/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://140.245.241.70:5001/api/health",
      },
    ];
  },
};

export default nextConfig;
