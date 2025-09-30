/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // semantic tokens -> CSS variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        // your custom brand palettes (kept as-is)
        brand: {
          50:"#ecfdf5",100:"#d1fae5",200:"#a7f3d0",300:"#6ee7b7",
          400:"#34d399",500:"#10b981",600:"#059669",700:"#047857",
          800:"#065f46",900:"#064e3b",
        },
        accentPalette: {
          50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",
          400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",
          800:"#1e40af",900:"#1e3a8a",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '2xl': '1.25rem',
      },
      boxShadow: { soft: "0 6px 20px rgba(16,24,40,0.08)" },
    },
  },
  plugins: [],
}
