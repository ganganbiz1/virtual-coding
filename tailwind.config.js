/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        'office-bg': '#1a1a2e',
        'office-card': '#16213e',
        'office-accent': '#0f3460',
        'office-highlight': '#e94560',
      }
    }
  },
  plugins: []
}
