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
        bg: "#F3F4F6",
        card: "#FFFFFF",
        ink: "#111827",
        primary: "#7C3AED",
        orange: "#F5A623",
        blue: "#0EA5E9",
        green: "#10B981",
        red: "#EF4444",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
