/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // FIX: These were missing, causing the crash
        border: "hsl(var(--border))", 
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        // Your Custom Brand Colors
        matri: {
          primary: "#7C3AED",    // Purple
          secondary: "#14B8A6",  // Teal
          action: "#F43F5E",     // Red (SOS)
          warning: "#FBBF24",    // Amber
          dark: "#1F2937",
          light: "#F9FAFB",
        },
      },
    },
  },
  plugins: [],
};