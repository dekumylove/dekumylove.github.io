import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://dekumylove.github.io',
  base: '/',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      langs: [
        'typescript', 'javascript', 'python', 'html', 'css',
        'bash', 'json', 'yaml', 'jsx', 'tsx', 'astro',
      ],
    },
  },
  integrations: [preact({ compat: false })],
  vite: {
    plugins: [tailwindcss()],
  },
});
