import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://macon170.com',
  output: 'static',
  build: {
    format: 'directory',
  },
});
