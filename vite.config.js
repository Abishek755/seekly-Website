import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        career: resolve(__dirname, 'career.html'),
        adminUnified: resolve(__dirname, 'admin/unified.html'),
        adminLogin: resolve(__dirname, 'admin/login.html')
      }
    }
  }
});
