/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Токены из дизайн-обсуждения: направление "Тёмная студия"
        bg: "#0F0F12",
        panel: "#1B1B20",
        accent: "#D9FF3F",
        "accent-2": "#FF4D6D",
        text: "#F2F2F0",
        "text-muted": "#8A8A90",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};
