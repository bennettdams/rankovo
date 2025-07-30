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
      keyframes: {
        appear: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        appear: "appear 0.8s cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
