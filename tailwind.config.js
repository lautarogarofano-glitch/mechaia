/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Liquid Glass design system (Spec 1: admin only)
        glass: {
          bg: "rgba(255,255,255,0.05)",
          elevated: "rgba(255,255,255,0.10)",
          border: "rgba(255,255,255,0.10)",
          "border-strong": "rgba(255,255,255,0.20)",
          text: "rgba(255,255,255,1)",
          mute: "rgba(255,255,255,0.70)",
          dim: "rgba(255,255,255,0.40)",
        },
        "accent-violet": "#a78bfa",
        "accent-cyan": "#22d3ee",
        "accent-pink": "#f472b6",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)",
        "glass-strong":
          "0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
      },
      backgroundImage: {
        "gradient-radial":
          "radial-gradient(ellipse at center, transparent 40%, rgba(2,6,23,0.85) 100%)",
      },
      fontFamily: {
        geist: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        "geist-mono": ["'Geist Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "blob-1": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(60px,-40px) scale(1.1)" },
          "66%": { transform: "translate(-40px,80px) scale(0.95)" },
        },
        "blob-2": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(-80px,60px) scale(1.05)" },
          "66%": { transform: "translate(40px,-50px) scale(0.9)" },
        },
        "blob-3": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(50px,40px) scale(1.08)" },
          "66%": { transform: "translate(-60px,-70px) scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "blob-1": "blob-1 22s ease-in-out infinite",
        "blob-2": "blob-2 28s ease-in-out infinite",
        "blob-3": "blob-3 24s ease-in-out infinite",
        "slide-in-right": "slide-in-right 250ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
