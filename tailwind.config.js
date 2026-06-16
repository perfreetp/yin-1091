/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        midnight: {
          950: '#0a0f1a',
          900: '#0f1b2d',
          800: '#1e3a5f',
          700: '#2a4d7a',
          600: '#3a6096',
          500: '#4a90d9',
        },
        mint: {
          500: '#2dd4a8',
          600: '#22b893',
        },
        amber: {
          500: '#f5a623',
        },
        coral: {
          500: '#e74c3c',
          600: '#c0392b',
        },
        medical: {
          orange: '#f0923b',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
