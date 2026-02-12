import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{html,tsx,ts,jsx,js}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class',
} satisfies Config;
