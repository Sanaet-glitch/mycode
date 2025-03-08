module.exports = {
  theme: {
    extend: {
      backdropFilter: {
        'glass': 'blur(16px) saturate(180%)',
      },
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.1)',
        'glass-dark': 'rgba(17, 25, 40, 0.75)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.25)',
        'neon': '0 0 5px theme(colors.primary.500), 0 0 20px theme(colors.primary.500)',
        'neon-lg': '0 0 10px theme(colors.primary.500), 0 0 30px theme(colors.primary.500)',
      },
      borderColor: {
        'glass': 'rgba(255, 255, 255, 0.18)',
      },
      colors: {
        border: 'hsl(var(--border))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.5), 0 0 10px rgba(14, 165, 233, 0.2)' },
          '100%': { boxShadow: '0 0 10px rgba(14, 165, 233, 0.7), 0 0 20px rgba(14, 165, 233, 0.4)' },
        },
      },
    },
  },
  plugins: [
  ],
}; 