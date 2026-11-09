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
        // Bảng màu Măng Non theo Idea03_MangNon_CoreDesign.md
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
          red: "#E63946",     // Đỏ hoa gạo / Đom đóm rợp trời Cây Đa Phù Đổng
          crimson: "#C1121F",
          ochre: "#DDA15E",
          paper: "#F7F2E7",   // Màu giấy điệp mộc bản Đông Hồ
          papermid: "#E8DEC8",
        },
      },
      fontFamily: {
        serif: ["Merriweather", "Georgia", "serif"],
      },
      animation: {
        "breathe": "breathe 4s ease-in-out infinite",
        "sway-gentle": "swayGentle 5s ease-in-out infinite",
        "firefly": "firefly 3s ease-in-out infinite",
        "glow-soft": "glowSoft 3s ease-in-out infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
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
      },
    },
  },
  plugins: [],
};
export default config;
