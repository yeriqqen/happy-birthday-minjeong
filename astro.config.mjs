import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const isUserOrOrgPagesRepo = repo.endsWith('.github.io');
const isGithubActionsBuild = Boolean(process.env.GITHUB_ACTIONS);

const site = owner ? `https://${owner}.github.io` : undefined;

const base = isGithubActionsBuild
  ? isUserOrOrgPagesRepo
    ? '/'
    : `/${repo}/`
  : '/';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
