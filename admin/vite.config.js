import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Solve Gestão — uso EXCLUSIVO em localhost. Não hospedar.
export default defineConfig({
  plugins: [react()],
  server: { port: 5205 },
})
