import type { Config } from 'tailwindcss';

/** Design tokens from docs/design-system.md §6 — single source of truth. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#E8F0FE', 100: '#D2E3FC', 200: '#AECBFA', 300: '#8AB4F8', 400: '#669DF6', 500: '#4285F4', 600: '#1A73E8', 700: '#1967D2', 800: '#185ABC', 900: '#174EA6' },
        success: { 50: '#E6F4EA', 100: '#CEEAD6', 300: '#81C995', 500: '#34A853', 600: '#1E8E3E', 700: '#188038', 900: '#0D652D' },
        warning: { 50: '#FEF7E0', 100: '#FEEFC3', 300: '#FDD663', 500: '#FBBC04', 600: '#F9AB00', 700: '#F29900', 900: '#E37400' },
        danger: { 50: '#FCE8E6', 100: '#FAD2CF', 300: '#F28B82', 500: '#EA4335', 600: '#D93025', 700: '#C5221F', 900: '#A50E0E' },
        neutral: { 0: '#FFFFFF', 50: '#F8F9FA', 100: '#F1F3F4', 200: '#E8EAED', 300: '#DADCE0', 400: '#BDC1C6', 500: '#9AA0A6', 600: '#80868B', 700: '#5F6368', 800: '#3C4043', 900: '#202124' },
      },
      fontFamily: {
        heading: ['Poppins', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'system-ui', 'sans-serif'],
        body: ['Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }],
        h1: ['1.875rem', { lineHeight: '2.375rem', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        body: ['1rem', { lineHeight: '1.5rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
      borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
      boxShadow: {
        e1: '0 1px 2px rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)',
        e2: '0 1px 3px rgba(60,64,67,.30), 0 4px 8px 3px rgba(60,64,67,.15)',
        e3: '0 8px 12px 6px rgba(60,64,67,.15), 0 4px 4px rgba(60,64,67,.30)',
      },
      screens: { md: '768px', xl: '1280px' },
      maxWidth: { container: '1200px' },
    },
  },
  plugins: [],
};
export default config;
