import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://targz.shop',
  integrations: [preact()],
  output: 'static',
});
