export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marca: {
          DEFAULT: '#FF6A2F',
          oscuro:  '#E5551B',
          suave:   '#FFF3ED',
        },
        tinta:  '#111827',
        tenue:  '#6B7280',
        borde:  '#E9E9E9',
        exito:  '#1D9E75',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
