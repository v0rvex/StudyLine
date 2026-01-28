import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "lucide-react": "lucide-react/dist/esm/lucide-react.js",
    },
  },
  optimizeDeps: {
    include: ["lucide-react"],
  },
  server: {
    host: true,   // делает доступным по IP (например 192.168.1.42:1200)
    port: 80,   // можно поменять на любой свободный порт
    cors: true,   // чтобы фронт можно было открыть из локалки
  },
  preview: {
    host: true,
    port: 80,
  },
})

