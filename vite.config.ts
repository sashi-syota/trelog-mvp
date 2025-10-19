// File: vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // 新ビルドが出たら自動更新
      includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Trelog MVP",
        short_name: "Trelog",
        description: "Training log app (MVP)",
        lang: "ja",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // SPAのナビゲーションをオフラインでも index.html にフォールバック
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        runtimeCaching: [
          {
            // ページ
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: { cacheName: "pages" }
          },
          {
            // JS/CSS/Worker
            urlPattern: ({ request }) =>
              ["style", "script", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "assets" }
          },
          {
            // 画像やフォント
            urlPattern: ({ request }) =>
              ["image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "static-resources",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      // ← 開発中にもSW挙動を確認したいときに便利（不要なら消してOK）
      devOptions: {
        enabled: true
      }
    })
  ]
});
