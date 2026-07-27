import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.macon170.com',
  output: 'static',
  build: {
    format: 'directory',
  },
});
