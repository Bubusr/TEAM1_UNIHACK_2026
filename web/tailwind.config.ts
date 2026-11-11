import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/screens/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bảng màu Măng Non theo Idea03_MangNon_CoreDesign.md & Prompt §9.2
        forest: {
          deep: "#1B2A2F",    // Xanh đêm sâu Rừng Tre (Ghibli night)
          darker: "#132024",
          abyss: "#0D1619",
          mist: "#273D44",
        },
        bamboo: {
          light: "#A7C4AC",
          soft: "#6B8F71",    // Xanh tre tự nhiên
          mid: "#52795B",
          deep: "#3E5C45",    // Xanh tre trầm ban ngày
          dark: "#2A4030",
        },
        warm: {
          light: "#FFE099",
          glow: "#FFD166",    // Vàng cam ấm điểm nhấn (Ống nứa Kaguya)
          amber: "#F4A259",   // Ánh sáng ấm đốt tre
          wood: "#BC6C25",    // Vàng đất / mộc bản
        },
        dongho: {
          red: "#C8412F",     // Đỏ Đông Hồ
          crimson: "#C1121F",
          pink: "#E8837A",    // Hồng sen Đông Hồ
          ochre: "#DDA15E",
          paper: "#F6EBD4",   // Màu giấy dó / điệp mộc bản Đông Hồ
          papermid: "#E8DEC8",
        },
        paper: {
          bamboo: "#E9D8A6",  // Thẻ tre khô
          do: "#F6EBD4",      // Giấy dó
        },
        ink: "#2B2118",
        node: {
          ring: "#B98B3E",
        },
      },
      fontFamily: {
        sans: ["var(--font-ui)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        hand: ["var(--font-hand)", "var(--font-ui)", "cursive", "sans-serif"],
        serif: ["Merriweather", "Georgia", "serif"],
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(.22, 1, .36, 1)",
      },
      animation: {
        "breathe": "breathe 3.6s ease-in-out infinite",
        "sway-gentle": "swayGentle 6s ease-in-out infinite",
        "firefly": "firefly 3s ease-in-out infinite",
        "glow-soft": "glowSoft 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.35s cubic-bezier(.22, 1, .36, 1) forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(.22, 1, .36, 1) forwards",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.02)" },
        },
        swayGentle: {
          "0%, 100%": { transform: "rotate(-1.5deg)" },
          "50%": { transform: "rotate(1.5deg)" },
        },
        glowSoft: {
          "0%, 100%": { filter: "drop-shadow(0 0 12px rgba(244, 162, 89, 0.4))" },
          "50%": { filter: "drop-shadow(0 0 24px rgba(255, 209, 102, 0.75))" },
        },
        firefly: {
          "0%, 100%": { opacity: "0.3", transform: "translateY(0px)" },
          "50%": { opacity: "0.9", transform: "translateY(-8px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
