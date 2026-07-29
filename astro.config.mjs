import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.macon170.com',
  output: 'static',
  vite: {
    server: {
      allowedHosts: ['kudzu'],
    },
  },
  build: {
    format: 'directory',
  },
});
