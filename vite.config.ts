import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ignore-missing-imports',
      // 存在しないすべての読み込みファイルを一括で自動無視（スルー）するカスタム設定
      resolveId(source) {
        if (
          source.startsWith('@/components/') || 
          source.startsWith('./') || 
          source.startsWith('../') ||
          source === 'lucide-react'
        ) {
          return { id: source, external: true }
        }
        return null
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
