/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  // Agrega esta configuración de DaisyUI:
  daisyui: {
    themes: ["caramellatte", "coffee", "bumblebee", "light", "dark"], 
  },
}