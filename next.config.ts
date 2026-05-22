import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "*.buzzheavier.com" },
      { protocol: "https", hostname: "buzzheavier.com" },
      { protocol: "https", hostname: "static.tvmaze.com" },
      { protocol: "https", hostname: "mediaimage.tvmaze.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  serverExternalPackages: ["mongoose"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
