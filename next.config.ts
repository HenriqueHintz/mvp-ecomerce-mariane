import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "drizzle-orm"],
  images: {
    deviceSizes: [640, 1080, 1920],
    imageSizes: [128, 384],
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
  async redirects() {
    return [
      { source: "/about", destination: "/sobre", permanent: true },
      { source: "/contact", destination: "/atendimento", permanent: true },
      { source: "/contato", destination: "/atendimento", permanent: true },
      { source: "/privacy", destination: "/politica-de-privacidade", permanent: true },
      { source: "/privacidade", destination: "/politica-de-privacidade", permanent: true },
      { source: "/trocas", destination: "/trocas-e-devolucoes", permanent: true },
      { source: "/devolucoes", destination: "/trocas-e-devolucoes", permanent: true },
      { source: "/returns", destination: "/trocas-e-devolucoes", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Vary",
            value:
              "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            "key": "Permissions-Policy",
            "value": "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

