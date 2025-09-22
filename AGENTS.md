# Repository Guidelines

## Basic Policy

- Agents must think in English but always communicate with users in Japanese.

## Project Structure & Module Organization

Hidamari is a pnpm workspace with `backend/` (Express + TypeScript) and `frontend/` (React + Vite). Server middleware, Auth.js wiring, and Prisma models live in `backend/src` and `backend/prisma`; generated clients stay in `backend/src/generated`. UI, hooks, and assets belong in `frontend/src`, with static files under `frontend/public`. Store design notes in `docs/`, and update each package’s `.env.example` whenever configuration changes.

## Build, Test, and Development Commands

- `cd backend && pnpm install` — install backend dependencies after lockfile updates.
- `cd backend && pnpm dev` — run the API on http://localhost:3001 using tsx + nodemon.
- `cd backend && pnpm exec prisma migrate dev && pnpm exec prisma generate` — apply schema changes from `prisma/schema.prisma`.
- `cd frontend && pnpm install && pnpm dev` — start the Vite dev server on http://localhost:5173; use `pnpm build` + `pnpm preview` for production checks.
- `pnpm lint`, `pnpm lint:fix`, and `pnpm format` (per package) — satisfy ESLint + Prettier before a PR.

## Coding Style & Naming Conventions

Prettier enforces two-space indentation and backend single quotes. ESLint flat configs require sorted imports (`eslint-plugin-simple-import-sort`) and no unused symbols. Use PascalCase for React components, camelCase for utilities and hooks (`useSomething`), and SCREAMING_SNAKE_CASE for environment keys. Keep TypeScript types near their modules and only add barrel exports when they improve clarity.

## Testing Guidelines

Automated tests are staged in `docs/tasks.md` (task 15). Add frontend specs with Vitest + React Testing Library as `src/**/*.{test,spec}.tsx`, and backend integration tests alongside Express routes using Jest-style tooling. Mock Gemini API calls and Auth.js adapters, document fixture prerequisites, and focus assertions on behavior over snapshots.

## Commit & Pull Request Guidelines

Follow the Conventional Commit history (`feat: improve security middleware…`). Keep commits focused, reference issues or checklist items when relevant, and describe migrations or schema changes explicitly. Pull requests should summarize the change, list manual/automated tests, attach UI screenshots when visuals move, and note new environment variables. Request review only after lint and targeted tests pass locally.

## Security & Configuration Tips

Never commit secrets. Preserve Helmet, CORS, and rate limiter middleware in `backend/src/middleware` when adding routes, and document exceptions in `docs/`. Record OAuth or Gemini configuration updates in `.env.example` so other agents can mirror the setup.
