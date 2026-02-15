/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://pollappapi.priyankaz.me/api/health",
      },
    ];
  },
};

export default nextConfig;
