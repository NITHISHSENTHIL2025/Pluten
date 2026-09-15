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
        frost: {
          DEFAULT: "#F4F6F5",
          high: "#FCFDFC",
          low: "#E8EBE9",
          ink: "#101313",
          muted: "#5B6060",
          shadow: "#C9CECB",
        },
      },
      borderRadius: {
        "pluten-xs": "10px",
        "pluten-sm": "14px",
        "pluten-md": "18px",
        "pluten-lg": "24px",
        "pluten-xl": "30px",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
