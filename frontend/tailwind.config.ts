import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // kiro.dev inspired palette
        base: "#090A0F",
        card: "#12141D",
        border: "#222638",
        accent: {
          violet: "#818cf8",
          cyan: "#22d3ee",
        },
        status: {
          ok: "#10B981",        // emerald - operational / no change
          warn: "#F59E0B",      // amber - change detected
          alert: "#EF4444",     // red - change detected / critical
        },
        muted: "#9ca3af",
        body: "#e5e7eb",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "GeistMono", "Menlo", "monospace"],
      },
      boxShadow: {
        "glow-violet": "0 0 24px rgba(129, 140, 248, 0.15)",
        "glow-cyan": "0 0 24px rgba(34, 211, 238, 0.12)",
        "glow-emerald": "0 0 20px rgba(16, 185, 129, 0.12)",
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(129, 140, 248, 0.10)" },
          "50%": { boxShadow: "0 0 35px rgba(129, 140, 248, 0.25)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      borderRadius: {
        card: "12px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
