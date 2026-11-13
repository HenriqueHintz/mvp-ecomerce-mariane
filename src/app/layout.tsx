import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "../../public/fx/sites-incriveis.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileFloatingActions from "@/components/MobileFloatingActions";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#75066A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://marianecosmeticos.com.br"),
  title: {
    default: "Mariane Cosméticos | Saúde, Beleza & Marcas Profissionais",
    template: "%s | Mariane Cosméticos",
  },
  description:
    "Linda é a mulher que bem se quer. Cosméticos profissionais, perfumes e produtos de beleza importados e nacionais. Loja física na Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300).",
  applicationName: "Mariane Cosméticos",
  keywords: [
    "Mariane Cosméticos",
    "cosméticos",
    "saúde e beleza",
    "marcas profissionais",
    "Wella Profissional",
    "L'Oréal Professionnel",
    "Truss",
    "Braé",
    "Lola Cosmetics",
    "Amend",
    "Madressenza",
    "Lages - SC",
    "cronograma capilar",
    "tratamento capilar",
    "perfumaria",
  ],
  authors: [
    {
      name: "Mariane Cosméticos",
      url: "https://www.instagram.com/mariane_cosmeticos_01/",
    },
  ],
  creator: "Mariane Cosméticos",
  publisher: "Mariane Cosméticos",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://marianecosmeticos.com.br",
    siteName: "Mariane Cosméticos",
    title: "Mariane Cosméticos | Saúde, Beleza & Marcas Profissionais",
    description:
      "Linda é a mulher que bem se quer. Cosméticos profissionais, perfumes e produtos de beleza importados e nacionais. Loja física na Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300).",
    images: [
      {
        url: "/logo.svg",
        width: 907,
        height: 358,
        alt: "Mariane Cosméticos — Saúde, Beleza & Marcas Profissionais",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mariane Cosméticos | Saúde, Beleza & Marcas Profissionais",
    description:
      "Linda é a mulher que bem se quer. Cosméticos profissionais, perfumes e produtos de beleza importados e nacionais. Loja física na Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300).",
    images: ["/logo.svg"],
    creator: "@mariane_cosmeticos_01",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`scroll-smooth ${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-silk-50 text-onyx-900 selection:bg-marina-100 selection:text-marina-800">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileFloatingActions />
        </CartProvider>
        <Script src="/fx/sites-incriveis.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
