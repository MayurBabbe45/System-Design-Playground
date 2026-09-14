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
        n8n: {
          bg: '#0e1117',
          surface: '#161922',
          card: '#1e2230',
          cardHover: '#262c3e',
          border: 'rgba(255, 255, 255, 0.09)',
          borderHover: 'rgba(255, 255, 255, 0.2)',
          accent: '#ff6d5a', // classic n8n warm coral
          blue: '#388bfd',
          emerald: '#2ea043',
          purple: '#a371f7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'n8n-node': '0 4px 20px -2px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'n8n-node-selected': '0 0 0 2px #388bfd, 0 8px 30px rgba(56, 139, 253, 0.3)',
        'n8n-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
};
