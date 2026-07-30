import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.macon170.com',
  output: 'static',
  integrations: [
    sitemap({
      // `page` is the full absolute URL, not a path. /events/ is a client-rendered shell that
      // reads ?event=<slug>; the bare URL renders no content, so it is not one of the pages
      // this site publishes.
      filter: (page) => !page.startsWith('https://www.macon170.com/events/'),
    }),
  ],
  vite: {
    server: {
      allowedHosts: ['kudzu'],
    },
  },
  build: {
    format: 'directory',
  },
});
