# 05 — Version Control, Environment & Release Standards (Favi-FE)

## 1. Version Control & Engineering Standards

### 1.1 Git Branching & Conventional Commits
- Conforms strictly to the **Conventional Commits** standard:
  - `feat(admin): add audit log data table with date range picker`
  - `fix(chat): scroll to bottom when new realtime message arrives`
  - `refactor(feed): extract feed card into memoized component`
  - `docs(fe): document client-side idempotency wrapper`

### 1.2 Code Quality Verification (Linting & Strict Type Checking)
Prior to merging pull requests into `main`, changes must cleanly pass:
```bash
# Verify TypeScript compile safety without emitting output
npx tsc --noEmit

# Verify Next.js production build bundle and static optimization
npm run build

# Enforce ESLint code styling rules
npm run lint
```
- Disallow arbitrary usage of `any`; all contracts must be explicitly modeled as interfaces or types in `src/types/`.

---

## 2. Environment Variables Configuration

Configuration values reside in `.env.local` for local development or are injected directly via production runtime orchestrators:

| Variable Name | Description | Example Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Root URL of the NGINX API Gateway | `http://localhost:5000` |
| `NEXT_PUBLIC_WS_URL` | SignalR WebSocket Gateway address | `http://localhost:5000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project endpoint | `https://jgounylmgjcmlwyzzzhv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon client key for Supabase | `eyJhbGci...` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary storage account name | `dumyugxhm` |

> **Security Rule**: Only variables prefixed with `NEXT_PUBLIC_` are exposed to client-side bundles. Never store administrative API secret keys or master credentials in frontend source repositories.

---

## 3. Production Build & Deployment Pipeline

1. **Bundle Optimization**:
   - Heavy dependencies (Admin analytics charts, WebRTC video overlays, media cropping tools) must use `next/dynamic` to minimize initial route payloads.
   - Self-hosted web fonts via `next/font` prevent layout shifts (CLS).

2. **Standalone Containerization**:
   The frontend is bundled using `output: 'standalone'` in `next.config.ts`, generating an optimized standalone container image under 150MB with instant startup characteristics.
