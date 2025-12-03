/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs personnalisées pour les groupes politiques
        politique: {
          gauche: '#CC2443',
          centreGauche: '#FF8080',
          centre: '#FFEB00',
          centreDroit: '#74B9FF',
          droite: '#0066CC',
          extremeDroite: '#0D378A',
        },
        // Couleurs pour les votes
        vote: {
          pour: '#10B981',
          contre: '#EF4444',
          abstention: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
