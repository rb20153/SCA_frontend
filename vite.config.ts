import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [
        AntDesignVueResolver({ importStyle: false }),
      ],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: [
      'codemirror',
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/commands',
      '@codemirror/language',
      '@codemirror/lang-json',
      '@lezer/highlight',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      // 联调后端服务器；浏览器只访问同源 5173，由 vite 转发，规避 CORS
      '/api': {
        target: 'http://8.130.55.127',
        changeOrigin: true,
      },
    },
  },
})
