import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Trigger restart for react-hot-toast dependency
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
