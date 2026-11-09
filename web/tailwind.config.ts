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
        bamboo: {
          50: "#f3faf3",
          100: "#e3f5e3",
          200: "#c7eac8",
          300: "#9cd79f",
          400: "#6abf6f",
          500: "#44a34b",
          600: "#33843a",
          700: "#2a6830",
          800: "#25532a",
          900: "#1f4524",
          950: "#0c2510",
        },
        phudong: {
          gold: "#f59e0b",
          glow: "#fbbf24",
          sacred: "#b45309",
        },
      },
      animation: {
        "breathe": "breathe 3s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "sway": "sway 4s ease-in-out infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", filter: "drop-shadow(0 0 10px rgba(74, 222, 128, 0.5))" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 25px rgba(250, 204, 21, 0.8))" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
