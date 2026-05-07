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
        primary: {
          DEFAULT: "#185FA5",
          hover: "#0C447C",
        },
        sidebar: "hsl(var(--muted))",
        success: {
          bg: "#EAF3DE",
          text: "#3B6D11",
        },
        warning: {
          bg: "#FAEEDA",
          text: "#854F0B",
        },
        processing: {
          bg: "#E6F1FB",
          text: "#185FA5",
        },
        draft: {
          bg: "#F1EFE8",
          text: "#5F5E5A",
        },
        failed: {
          bg: "#FCEBEB",
          text: "#A32D2D",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
      borderWidth: {
        '0.5': '0.5px',
      }
    },
  },
  plugins: [],
};
export default config;
