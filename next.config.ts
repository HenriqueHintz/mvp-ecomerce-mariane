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
        source: "/:path*",
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

