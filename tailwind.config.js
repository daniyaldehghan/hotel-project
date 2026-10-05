/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./providers/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", card: "var(--card)", ink: "var(--ink)", mut: "var(--mut)", line: "var(--line)",
        violet: "#6C3BFF", coral: "#FF5E7A", aqua: "#22E3D2", sun: "#FFC83D",
        night: "#150A33", night2: "#2A0F6B",
      },
      // هر borderی که رنگ نداشته باشد، خودکار با تم عوض می‌شود
      borderColor: { DEFAULT: "var(--line)" },
      divideColor: { DEFAULT: "var(--line)" },
      fontFamily: { sans: ["var(--font-vazir)", "Tahoma", "sans-serif"] },
    },
  },
  plugins: [],
};
