import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5205 },
  build: {
    // O alvo padrão do Vite 8 assume navegadores de 2025. Dentro do APK quem
    // executa é a WebView do aparelho, que em tablet antigo pode ser bem mais
    // velha — e uma sintaxe nova demais derruba o bundle inteiro na hora de
    // interpretar, antes de qualquer código rodar (tela presa na splash).
    // es2017 é transpilado pelo esbuild e roda em WebView antiga sem custo real.
    target: 'es2017',
  },
})
