/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Space Mono"', "monospace"],
        display: ['"Space Grotesk"', "sans-serif"],
      },
      colors: {
        brutYellow: "#FFD600",
        brutPink: "#FF6B9D",
        brutBlue: "#4ECDC4",
        brutPurple: "#A855F7",
        brutOrange: "#FF8C42",
        brutGreen: "#06D6A0",
        brutRed: "#EF476F",
        brutDark: "#1A1A2E",
        brutCream: "#FFF8E7",
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #1A1A2E",
        "brutal-lg": "6px 6px 0px 0px #1A1A2E",
        "brutal-xl": "8px 8px 0px 0px #1A1A2E",
      },
    },
  },
  plugins: [],
};
