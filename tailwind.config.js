/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f9f7',
          100: '#f1f3ef',
          200: '#e3e7df',
          300: '#d1d7c7',
          400: '#b8c2a8',
          500: '#9aaa85',
          600: '#7a8450',
          700: '#596b47',
          800: '#4a5a3a',
          900: '#3d4a2f',
        }
      },
      fontFamily: {
        sans: ['Space Mono', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}