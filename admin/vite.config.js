import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 后台管理：本地 5174，代理 /api 与 /uploads 到后端
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
    },
  },
})
