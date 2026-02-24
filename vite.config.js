import { defineConfig } from 'vite';

export default defineConfig({
  base: '/sgame-simulator',
  server: {
    host: '0.0.0.0',
    port: 17500,
    open: true
  },
  preview: {
    host: '0.0.0.0',
    port: 17500,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
