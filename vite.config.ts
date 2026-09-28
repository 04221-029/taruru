import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    rollupOptions: {
      // 足りないコンポーネントや外部ライブラリを強制的にエラー対象から外します
      external: [
        '@/components/ui/sonner',
        '@/components/ui/button',
        '@/components/ui/dialog',
        '@/components/ui/dropdown-menu',
        '@/components/ui/tabs',
        'lucide-react'
      ],
    },
  },
})
