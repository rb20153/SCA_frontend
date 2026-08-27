import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

/** 联调后端地址兜底；实际取值优先读 .env.* 的 VITE_API_PROXY_TARGET */
const DEFAULT_API_PROXY_TARGET = 'http://8.130.55.127'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_')

  // 浏览器只访问同源的 dev/preview 端口，由 vite 转发到后端，规避 CORS
  const apiProxy: Record<string, ProxyOptions> = {
    '/api': {
      target: env.VITE_API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET,
      changeOrigin: true,
    },
  }

  return {
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
      proxy: apiProxy,
    },
    // 本地验证生产构建产物时同样需要转发 /api，否则 preview 下所有接口 404
    preview: {
      port: 4173,
      proxy: apiProxy,
    },
  }
})
