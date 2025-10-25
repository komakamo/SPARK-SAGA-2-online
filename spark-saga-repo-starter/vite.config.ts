import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './', // Or your repository name if deploying to a subdirectory
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SPARK SAGA',
        short_name: 'SparkSaga',
        description: 'A SaGa-like JRPG built with Vite and TypeScript.',
        theme_color: '#0f172a',
      },
    }),
  ],
})
