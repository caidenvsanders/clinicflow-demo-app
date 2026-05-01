import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15202b",
        clinic: {
          blue: "#2563eb",
          teal: "#0f766e",
          mint: "#dcfce7",
          sky: "#e0f2fe",
          rose: "#fff1f2",
          amber: "#fef3c7"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
