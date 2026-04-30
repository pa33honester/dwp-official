import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0A0A0A",
        surface: "#14110F",
        elevated: "#1C1815",
        border: "#2A2520",
        gold: {
          DEFAULT: "#D4A24C",
          400: "#E0B669",
          500: "#D4A24C",
          600: "#B8862F",
        },
        muted: "#A1A1AA",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(212, 162, 76, 0.5), 0 8px 24px rgba(212, 162, 76, 0.15)",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #E0B669 0%, #D4A24C 50%, #B8862F 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
