import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 前台官网：本地 5173，代理 /api 与 /uploads 到后端
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
    },
  },
})
