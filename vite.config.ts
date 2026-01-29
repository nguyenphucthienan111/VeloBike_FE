import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }: ConfigEnv) => {
    const env = loadEnv(mode, '.', '');
    
    // HTTPS disabled for now - using HTTP for local development
    const httpsConfig = false as any;

    return {
      server: {
        port: 3000,
        host: 'localhost', // Chỉ chạy trên localhost
        https: httpsConfig,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
