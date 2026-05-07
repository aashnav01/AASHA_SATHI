/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   '#7C4D9F',   // Deep lavender — buttons, active, links, icons
        secondary: '#B08CC0',   // Mid lavender — labels, timestamps, muted meta
        lavender:  '#F3EEFA',   // Lavender tint — header bg, active nav, row washes
        bgWarm:    '#FAF7F5',   // Page background — warm, not cold
        rose:      '#E8A0B4',   // Dusty rose — maternal, ANC, pregnancy indicators
        danger:    '#A63D57',   // Deep rose — SOS, overdue, critical only
        amber:     '#D4A017',   // Warm amber — incentive ₹, pending, due-today
        sage:      '#2A7D52',   // Sage green — completed, paid, success states
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-ring':   'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':      'shimmer 2.5s ease-in-out infinite',
        'bounce-in':    'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'spring-pop':   'springPop 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards',
        'sheet-up':     'sheetUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-in':     'toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-out':    'toastOut 0.28s cubic-bezier(0.4, 0, 1, 1) forwards',
        'sos-pulse':    'sosPulse 3s ease-in-out infinite',
        'sos-expand':   'sosExpand 0.22s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        'shake-warn':   'shakeWarn 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'green-ripple': 'greenRipple 0.5s ease-out forwards',
        'count-up':     'fadeIn 0.3s ease-out forwards',
        'stagger-item': 'staggerItem 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'offline-dot':  'offlineDot 1.8s ease-in-out infinite',
      },
      keyframes: {
        pulseRing: {
          '0%':   { transform: 'scale(1)', opacity: '0.6' },
          '50%':  { transform: 'scale(1.4)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(0.3)' },
          '50%':  { opacity: '1', transform: 'scale(1.05)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          from: { boxShadow: '0 0 5px rgba(124,77,159,0.2), 0 0 15px rgba(124,77,159,0.1)' },
          to:   { boxShadow: '0 0 10px rgba(124,77,159,0.4), 0 0 30px rgba(124,77,159,0.2)' },
        },
        springPop: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.28)' },
          '70%':  { transform: 'scale(0.94)' },
          '100%': { transform: 'scale(1)' },
        },
        sheetUp: {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateY(120%) scale(0.95)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        toastOut: {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to:   { opacity: '0', transform: 'translateY(120%) scale(0.95)' },
        },
        sosPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(166,61,87,0.35)' },
          '50%':       { boxShadow: '0 0 0 14px rgba(166,61,87,0)' },
        },
        sosExpand: {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        shakeWarn: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-6px)' },
          '40%':      { transform: 'translateX(5px)' },
          '60%':      { transform: 'translateX(-3px)' },
          '80%':      { transform: 'translateX(2px)' },
        },
        greenRipple: {
          '0%':   { backgroundColor: 'rgba(42,125,82,0.15)' },
          '100%': { backgroundColor: 'transparent' },
        },
        staggerItem: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        offlineDot: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.3' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
