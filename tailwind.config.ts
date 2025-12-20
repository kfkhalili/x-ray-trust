import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        trust: {
          trusted: '#10b981', // emerald-500
          caution: '#f59e0b', // amber-500
          danger: '#ef4444', // rose-500
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
export default config;

