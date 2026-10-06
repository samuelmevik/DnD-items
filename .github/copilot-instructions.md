# Copilot Instructions for DnD-items

This repository is a React + TypeScript + Vite app for browsing D&D items.

## Key commands

- `npm install`
- `npm run dev` — start the local Vite development server
- `npm run build` — build the app
- `npm run lint` — run ESLint for the repo
- `npm run preview` — preview a production build locally

## Important files

- `src/App.tsx` — app shell and main page entry
- `src/main.tsx` — application bootstrap
- `src/index.css` — global styles
- `src/components/` — UI components and page pieces
- `src/data/items.ts` — item dataset
- `src/lib/` — app logic helpers, filters, favorites, URL state, API wrappers

## What matters for AI tasks

- Follow YAGNI principles, and one-liner solutions.

## Notes

- ESLint config is in `eslint.config.js`.
- This repo is private and uses local `dnd-items` package references only.
