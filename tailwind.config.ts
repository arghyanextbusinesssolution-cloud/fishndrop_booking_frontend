import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#faf9f5",
        surface: "#faf9f5",
        "surface-container": "#efeeea",
        "surface-container-low": "#f4f4f0",
        "surface-container-high": "#e9e8e4",
        "surface-container-highest": "#e3e2df",
        "surface-container-lowest": "#ffffff",
        primary: "#735c00",
        "primary-container": "#d4af37",
        "on-primary": "#ffffff",
        "on-primary-container": "#554300",
        secondary: "#5f5e5e",
        "secondary-container": "#e4e2e1",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#656464",
        tertiary: "#665d52",
        "tertiary-container": "#bdb1a4",
        "on-tertiary": "#ffffff",
        "on-surface": "#1b1c1a",
        "on-surface-variant": "#4d4635",
        outline: "#7f7663",
        "outline-variant": "#d0c5af",
        error: "#ba1a1a",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      fontFamily: {
        headline: ["var(--font-newsreader)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"],
        label: ["var(--font-manrope)", "sans-serif"],
      },
    },
  },
};

export default config;
