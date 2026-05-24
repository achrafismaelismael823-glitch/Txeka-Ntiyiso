/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Azul institucional (Confiança e Autoridade)
        primary: "#0d47a1", 
        // Vermelho de destaque (Atenção/Erros/Alertas)
        secondary: "#e53935", 
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
