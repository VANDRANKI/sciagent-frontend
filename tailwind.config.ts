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
        base: "#0a0a14",
        card: "#12121f",
        input: "#1a1a2e",
        "card-hover": "#1e1e30",
        border: "#2d2d4e",
        "border-bright": "#4a4a7a",
        accent: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          glow: "#818cf8",
          hover: "#4f52d1",
        },
        text: {
          primary: "#e2e8f0",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
        success: "#10b981",
        "success-bg": "#052e16",
        error: "#ef4444",
        "error-bg": "#1f0a0a",
        warning: "#f59e0b",
        "warning-bg": "#1c1300",
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
          "0%, 100%": {
            boxShadow: "0 0 8px 2px rgba(99, 102, 241, 0.4)",
          },
          "50%": {
            boxShadow: "0 0 20px 6px rgba(99, 102, 241, 0.7)",
          },
        },
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(0, 0, 0, 0.4)",
        "accent-glow": "0 0 20px 4px rgba(99, 102, 241, 0.35)",
        "success-glow": "0 0 12px 2px rgba(16, 185, 129, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
