module.exports = {
  content: [
    './client/src/**/*.{js,jsx,ts,tsx}',
    './shared/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
        'mono': ['Monaco', 'monospace'],
        'roboto': ['Roboto', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
        'lora': ['Lora', 'serif'],
        'source-code-pro': ['Source Code Pro', 'monospace'],
      },
    },
  },
  plugins: [],
};
