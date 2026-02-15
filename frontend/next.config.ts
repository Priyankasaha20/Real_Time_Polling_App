/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://pollappapi.priyankaz.me/api/:path*",
      },
    ];
  },
};

export default nextConfig;
