import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ["var(--font-sans)"],
      serif: ["var(--font-serif)"],
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        "secondary-fg": "var(--secondary-fg)",
        tertiary: "var(--tertiary)",
        gray: "var(--gray)",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
