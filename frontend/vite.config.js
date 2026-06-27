import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendTarget =
  process.env.VITE_PROXY_TARGET?.trim() ||
  "http://127.0.0.1:8000"
const enableLocalHsts = process.env.VITE_ENABLE_HSTS === 'true'

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src 'self' ws: wss: ${backendTarget} http://localhost:8000 https:`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}

if (enableLocalHsts) {
  securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
}

const blockedPathPatterns = [
  /^\/package\.json$/,
  /^\/package-lock\.json$/,
  /^\/\.env/,
  /^\/\.git/,
  /^\/vite\.config\.js$/,
  /^\/eslint\.config\.js$/,
  /^\/tsconfig/,
]

function blockSensitiveFiles() {
  const middleware = (req, res, next) => {
    const path = (req.url || '').split('?')[0]

    if (blockedPathPatterns.some((pattern) => pattern.test(path))) {
      res.statusCode = 404
      res.end('Not Found')
      return
    }

    next()
  }

  return {
    name: 'block-sensitive-files',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    blockSensitiveFiles(),
  ],

  server: {
    host: true,
    allowedHosts: true,

    port: 5173,
    strictPort: true,

    headers: securityHeaders,

    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/api/media": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/media": {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },

  preview: {
    host: true,
    headers: securityHeaders,
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/api/media": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/media": {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
})
