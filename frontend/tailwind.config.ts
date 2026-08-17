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
        obsidian: "#0a0a0a",
        premiumRed: "#8b0000",
        crimson: "#b90e0a",
        steel: "#2d2d2d",
        softWhite: "#f5f5f5",
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%)',
      }
    },
  },
  plugins: [],
};
export default config;
