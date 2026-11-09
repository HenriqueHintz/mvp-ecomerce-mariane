import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Next.js CSS Variable Bridges
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Mariane Brand Official Purple/Violet Scale (#6B0072 / #75066A / #4A004D)
        marina: {
          50: "#FAF5FB",   // Violet mist
          100: "#F3E5F5",  // Delicate violet tint
          200: "#E6C8E9",  // Soft lilac border
          300: "#D39ED9",  // Lilac accent
          400: "#B866C2",  // Bright violet highlight
          500: "#9C27B0",  // Vibrant royal violet
          600: "#75066A",  // OFFICIAL PRIMARY MARIANE PURPLE (#75066A / #6B0072)
          700: "#600356",  // Deep imperial violet
          800: "#4D0046",  // Deep brand violet (#4A004D)
          900: "#360031",  // Midnight velvet plum
          950: "#22001F",  // Onyx violet deep
        },

        // Semantic Brand Tokens (Mariane Cosméticos)
        brand: {
          DEFAULT: "#75066A",  // Primária (Roxo/Violeta Imperial)
          vibrant: "#9C27B0",  // Vibrante (Royal Violet)
          dark: "#4D0046",     // Escuro (Deep Brand Violet)
          accent: "#EB1E78",   // Destaque (Magenta)
          light: "#FAF5FB",    // Superfície (Violet Mist)
        },
        "luxury-onyx": "#1A0918",
        "luxury-offwhite": "#FAF7FB",

        // Luxury Dark Neutrals with Deep Warm Undertone
        onyx: {
          DEFAULT: "#170E11",
          950: "#120A0D",
          900: "#1C1115",
          800: "#2B1B21",
          700: "#45333A",
          600: "#5C4750",
          400: "#8F7A82",
        },

        // Luxury Silk Surfaces
        silk: {
          DEFAULT: "#FAF7F7",
          50: "#FAF7F7",
          100: "#F4EDED",
          200: "#EAE0E3",
          300: "#D9C9CD",
        },

        // Official WhatsApp & Trust Accents
        emerald: {
          whatsapp: "#25D366",
          dark: "#128C7E",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "marina-sm": "0 2px 8px -2px rgba(117, 6, 106, 0.18)",
        "marina-md": "0 4px 16px -4px rgba(117, 6, 106, 0.24)",
        "marina-lg": "0 8px 24px -6px rgba(117, 6, 106, 0.32)",
        "luxury-card": "0 2px 12px 0 rgba(23, 14, 17, 0.04), 0 8px 24px -4px rgba(23, 14, 17, 0.06)",
        "luxury-hover": "0 12px 32px -4px rgba(23, 14, 17, 0.12), 0 4px 12px -2px rgba(117, 6, 106, 0.18)",
      },
      keyframes: {
        scaleIn: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        carouselMarquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-33.333333%)" },
        },
        marqueeLoop: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        scaleIn: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        fadeIn: "fadeIn 0.35s ease-out",
        slideUp: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulseSlow 3s ease-in-out infinite",
        pulseSlow: "pulseSlow 3s ease-in-out infinite",
        "carousel-marquee": "carouselMarquee 32s linear infinite",
        "marquee-loop": "marqueeLoop 28s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
