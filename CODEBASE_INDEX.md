# Codebase Index

This file provides a quick index and summary of the project structure, main files, exports, routes, API endpoints, and important components/hooks.

## Project root

- `package.json` — project manifest
- `vite.config.ts` — Vite configuration
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TypeScript configs
- `index.html` — app HTML entry
- `README.md` — project README

## src/ (top-level)

- `main.tsx` — React entry. Creates React root and wraps `<App />` with React Query's `QueryClientProvider`. Also includes `ReactQueryDevtools`.
  - Key exports: none (entry file)
  - Dependencies: `@tanstack/react-query`, `react-dom`

- `App.tsx` — Router setup and lazy route loading
  - Uses `react-router-dom` BrowserRouter, Routes, Suspense
  - Lazy-loads `./pages/Signup` and registers route: `Route path="/signup" element={<Signup/>}`
  - Export: default `App()` component

- `index.css`, `App.css` — styling

## src/pages/

- `Signup.tsx` (React + react-hook-form + zod)
  - Exports: default `Signup: React.FC`
  - Uses: `react-hook-form`, `zod` + `@hookform/resolvers/zod`
  - Form shape (zod): { name: string, email: string, password: string, role: 'user'|'admin' }
  - Uses `useSignup()` hook to perform registration. On submit calls `mutateAsync(payload)`
  - Route: loaded at `/signup` (from `App.tsx`)

- `Login.tsx`
  - Exports: default `Login` component (simple placeholder)

## src/api/

- `auth.ts`
  - Exports: `RegisterPayload` type and `async function registerUser(payload: RegisterPayload)`
  - Calls `api.post('/user/register', payload)` and returns `data`

## src/lib/

- `axios.ts`
  - Exports: `api` — axios instance configured with:
    - baseURL: `http://localhost:3000/api`
    - withCredentials: true

## src/hooks/

- `useSignup.ts`
  - Exports: `useSignup()` which returns a `useMutation` from `@tanstack/react-query` using `registerUser` as the mutation function.

## Routing summary

- `/signup` — Signup page (lazy-loaded)
- No other routing defined in `App.tsx` (only Signup route present)

## API endpoints (observed)

- Base API: `http://localhost:3000/api` (from `src/lib/axios.ts`)
- `POST /user/register` — used by `src/api/auth.ts::registerUser`

## React Query

- Query client set up in `main.tsx` with `QueryClientProvider` and `ReactQueryDevtools` enabled.

## Notes / Next steps

- Tests: none observed in the workspace. Consider adding unit tests for `api/auth.ts` and integration tests for the signup flow.
- Add README section describing local backend expectations (port 3000 `/api`) and `.env` variables if needed.

---

Generated at: 2025-11-09

File locations:
- Human-readable index: `CODEBASE_INDEX.md`
- Machine-readable index: `codebase_index.json`

