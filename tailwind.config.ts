import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  future: {
    // disable sticky hover
    hoverOnlyWhenSupported: true,
  },
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
        "primary-fg": "var(--primary-fg)",
        secondary: "var(--secondary)",
        "secondary-fg": "var(--secondary-fg)",
        tertiary: "var(--tertiary)",
        "tertiary-fg": "var(--tertiary-fg)",
        gray: "var(--gray)",
        "light-gray": "var(--light-gray)",
        "dark-gray": "var(--dark-gray)",
        error: "var(--error)",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
