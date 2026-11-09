import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "drizzle-orm"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lindacosmeticos.cdn.magazord.com.br",
      },
      {
        protocol: "https",
        hostname: "public-resources.zordcdn.com.br",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "scontent.cdninstagram.com",
      },
    ],
  },
};

export default nextConfig;

