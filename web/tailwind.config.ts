import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Light, high-contrast palette: this app gets used outdoors in daylight.
        bone: { 50: "#fbfaf7", 100: "#f5f3ec", 200: "#e9e5da", 300: "#d8d3c4" },
        ink: { 900: "#14181a", 700: "#3a4247", 500: "#5f6a70", 300: "#8c979d" },
        leaf: { 700: "#1c6b45", 600: "#258454", 500: "#2f9e64", 300: "#7fd0a4", 100: "#dcf1e6" },
        clay: { 700: "#9c3b1f", 600: "#bd4a26", 500: "#d9622f", 100: "#fbe7dc" },
        sun: { 600: "#b8860b", 500: "#d9a318", 100: "#fdf1d3" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,24,26,0.05), 0 12px 28px -18px rgba(20,24,26,0.28)",
        lift: "0 2px 4px rgba(20,24,26,0.06), 0 20px 44px -22px rgba(20,24,26,0.35)",
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateY(-10%)", opacity: "0" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { transform: "translateY(410%)", opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        grow: { from: { width: "0%" }, to: { width: "var(--w)" } },
      },
      animation: {
        "scan-line": "scan-line 1.9s ease-in-out infinite",
        "fade-up": "fade-up 0.32s ease-out both",
        grow: "grow 0.6s cubic-bezier(0.2,0.7,0.2,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
