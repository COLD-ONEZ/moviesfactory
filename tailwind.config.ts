import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#e50914",
          dark: "#0a0a0a",
          card: "#111111",
          surface: "#1a1a1a",
          border: "#2a2a2a",
        },
      },
      fontFamily: {
        bebas: ["var(--font-bebas)", "sans-serif"],
        rajdhani: ["var(--font-rajdhani)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
        fadeInUp: "fadeInUp 0.6s ease forwards",
        heroSlide: "heroSlide 0.8s ease forwards",
        pulseGlow: "pulseGlow 0.8s ease infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(32px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        heroSlide: {
          from: { opacity: "0", transform: "scale(1.04)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 16px rgba(229,9,20,.5)" },
          "50%": { boxShadow: "0 0 32px rgba(229,9,20,.9)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
