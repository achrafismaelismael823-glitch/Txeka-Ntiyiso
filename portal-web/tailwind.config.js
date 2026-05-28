/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Oficial Txeka Ntiyiso
        primary: "#0B192C",       // Azul Ntiyiso (Profundo/Autoridade)
        secondary: "#00D2C4",     // Ciano Txeka (Inovação e Foco)
        'ntiyiso-bg': "#F8FAFC",  // Branco Puro / Cinza Neutro de Fundo
        'val-success': "#10B981", // Verde Validação (Autêntico)
        'val-error': "#EF4444",   // Vermelho Fraude (Inválido)
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'], // Interface e Títulos
        mono: ['"JetBrains Mono"', 'monospace'],              // Para os 64 caracteres do SHA-256
      },
    },
  },
  plugins: [],
}
