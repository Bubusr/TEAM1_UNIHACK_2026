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
        // Master Style Guide Palette: Rough Doodle & Muted Pastel
        doodle: {
          sage: "#7E9A85",
          olive: "#727D56",
          blue: "#6B818C",
          cream: "#F4EEDD",
          ochre: "#CFA85B",
          brick: "#A84D3D",
          brown: "#5C4D43",
          charcoal: "#26292B",
          ink: "#1F2224",
          shadow: "#191B1D",
          forest: "#222E30",
          mist: "#2D3C3F",
        },
        forest: {
          deep: "#222E30",    // Eerie vintage forest
          darker: "#1A2426",
          abyss: "#141C1E",
          mist: "#2D3C3F",
        },
        bamboo: {
          light: "#8FA996",
          soft: "#7E9A85",    // Dusty sage green
          mid: "#6A8B74",
          deep: "#5A6544",    // Muted olive
          dark: "#475235",
        },
        warm: {
          light: "#DFC07A",
          glow: "#CFA85B",    // Muted ochre
          amber: "#CFA85B",
          wood: "#5C4D43",    // Desaturated brown
        },
        dongho: {
          red: "#A84D3D",     // Weathered brick red
          crimson: "#8E3E30",
          pink: "#D48C7F",
          ochre: "#CFA85B",   // Muted ochre
          paper: "#F4EEDD",   // Warm cream Dó paper
          papermid: "#EDE5D2",
        },
        paper: {
          bamboo: "#EDE5D2",
          do: "#F4EEDD",
        },
        ink: "#26292B",
        node: {
          ring: "#727D56",
        },
      },
      boxShadow: {
        // 2D Flat Cel Shadows (0px blur — Strict 2D Aesthetic)
        "flat-2d": "3px 3.5px 0px #191B1D",
        "flat-2d-sm": "2px 2px 0px #191B1D",
        "flat-2d-lg": "5px 5.5px 0px #191B1D",
        woodblock: "3px 3.5px 0px #191B1D",
        "woodblock-sm": "2px 2px 0px #191B1D",
        "woodblock-lg": "5px 5.5px 0px #191B1D",
        "misprint-red": "4px 4px 0px #A84D3D",
        "misprint-bamboo": "4px 4px 0px #7E9A85",
        "misprint-amber": "4px 4px 0px #CFA85B",
      },
      fontFamily: {
        sans: ["var(--font-ui)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        hand: ["var(--font-hand)", "var(--font-ui)", "cursive", "sans-serif"],
        serif: ["Merriweather", "Georgia", "serif"],
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(.22, 1, .36, 1)",
        stepped3: "steps(3, end)",
        stepped4: "steps(4, end)",
      },
      animation: {
        // Cuphead 1930s Stepped 2D Wiggle (Rubber-hose Squash & Stretch at 4-6 FPS)
        "wiggle-2d": "wiggleCuphead 0.35s steps(3, end) infinite",
        "boil-2d": "boilLine 0.25s steps(4, end) infinite",
        "breathe": "breathe 3.6s ease-in-out infinite",
        "sway-gentle": "swayGentle 6s ease-in-out infinite",
        "firefly": "firefly 3s steps(3, end) infinite",
        "fade-in": "fadeIn 0.2s steps(3, end) forwards",
        "slide-up": "slideUp 0.25s steps(3, end) forwards",
      },
      keyframes: {
        wiggleCuphead: {
          "0%": { transform: "rotate(-0.5deg) scale(1.007, 0.993) translate(-0.3px, 0px)" },
          "33%": { transform: "rotate(0.5deg) scale(0.993, 1.007) translate(0.3px, -0.6px)" },
          "66%": { transform: "rotate(-0.25deg) scale(1.008, 0.992) translate(0px, 0.3px)" },
          "100%": { transform: "rotate(-0.5deg) scale(1.007, 0.993) translate(-0.3px, 0px)" },
        },
        boilLine: {
          "0%": { transform: "translate(0px, 0px)" },
          "25%": { transform: "translate(1.5px, -1px)" },
          "50%": { transform: "translate(-1px, 1.5px)" },
          "75%": { transform: "translate(1px, 0.5px)" },
          "100%": { transform: "translate(0px, 0px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.02)" },
        },
        swayGentle: {
          "0%, 100%": { transform: "rotate(-1.5deg)" },
          "50%": { transform: "rotate(1.5deg)" },
        },
        firefly: {
          "0%, 100%": { opacity: "0.3", transform: "translateY(0px)" },
          "50%": { opacity: "0.9", transform: "translateY(-6px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
