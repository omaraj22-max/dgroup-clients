import type { Config } from "tailwindcss";

// Paleta arena / costa — mapeada para usar utilidades Tailwind si las necesitas.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#FAF8F5",
        ink: "#1C1917",
        sub: "#78716C",
        line: "#E7E2DB",
        card: "#FFFFFF",
        accent: "#0F766E", // teal profundo (mar)
        gold: "#B08D57",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
