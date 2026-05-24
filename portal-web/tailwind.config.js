/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d47a1", // Azul institucional para Moçambique
        secondary: "#e53935", // Vermelho de destaque
      }
    },
  },
  plugins: [],
}
