import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Ocean palette
        // base=#0f172a vs card=#1e293b: 11 lightness units apart (was only 2 - visually identical)
        base: "#0f172a",
        card: "#1e293b",
        input: "#0d1829",
        "card-hover": "#263447",
        border: "#334155",
        "border-bright": "#4b5563",

        accent: {
          primary: "#818cf8",   // indigo-400 - brighter on dark bg than 500
          secondary: "#a78bfa", // violet-400
          glow: "#c7d2fe",      // indigo-200 - for citations and highlights
          hover: "#6366f1",     // indigo-500 - hover darken
          muted: "#1e1b4b",     // indigo-950 - subtle bg
        },

        text: {
          primary: "#f1f5f9",   // slate-100 - very readable
          secondary: "#cbd5e1", // slate-300 - clearly readable
          muted: "#64748b",     // slate-500
        },

        success: "#4ade80",
        "success-bg": "#052e16",
        "success-border": "#166534",

        error: "#f87171",
        "error-bg": "#1f0707",
        "error-border": "#7f1d1d",

        warning: "#fbbf24",
        "warning-bg": "#1c1000",
      },

      animation: {
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.35s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px 2px rgba(129, 140, 248, 0.3)" },
          "50%":       { boxShadow: "0 0 22px 6px rgba(129, 140, 248, 0.55)" },
        },
      },

      boxShadow: {
        card: "0 4px 24px 0 rgba(0, 0, 0, 0.45), 0 1px 0 0 rgba(255,255,255,0.04) inset",
        "card-hover": "0 8px 32px 0 rgba(0, 0, 0, 0.55)",
        "accent-glow": "0 0 20px 4px rgba(129, 140, 248, 0.3)",
        "success-glow": "0 0 12px 2px rgba(74, 222, 128, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
