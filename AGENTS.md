# Copilot & Agent Operating Instructions

You must work with exceptional precision and system-level depth because GPT Codex and rigorous code review tools will inspect and validate your output.

---

## 1. Mandatory Documentation Protocol

### 1.1 Before Starting Any Task (Search & Review First)
- **Mandatory Document Search**: Before modifying any code, creating new files, or proposing architectural changes, the agent **MUST search for and read relevant technical documents** in the `document/` folder (`Favi-FE/document` and/or `Favi-BE/document`).
- Review the specific screen designs, component standards, API wrappers, caching rules, and state management conventions established for the affected areas.
- Never write code based on assumptions if a document exists covering that domain.

### 1.2 Undocumented Technical Terms & Patterns Protocol (Proactive Documentation)
- **Mandatory Documentation of New / Discovered Concepts**: If the agent implements, updates, discovers, or encounters any technical terms, UI/UX patterns, architectural mechanisms, client caching strategies, WebRTC signaling states, or HTTP interceptor workflows that are **not yet documented** or are insufficiently documented in `document/`, the agent **MUST proactively create new documentation or update existing documents** covering those terms and concepts.
- No technical term, pattern, or mechanism should exist in the codebase without a formal, comprehensive technical specification in `document/`.

### 1.3 After Making Any Changes (Keep Documents Synchronized)
- **Mandatory Documentation Update**: After implementing, refactoring, or modifying any page, component, hook, service, or API integration, the agent **MUST immediately update the corresponding documents** in `document/` to reflect the changes.
- Implementation and documentation must stay 100% in sync at all times. Leaving documents stale or outdated is strictly forbidden.

---

## 2. Core Frontend Architectural & Implementation Principles

### 2.1 Next.js 15 App Router & React 19
- **Routing Structure**: All pages are localized under `src/app/[locale]/`. 
- **Server vs Client Components**: Layouts and SEO wrappers are Server Components by default. Interactive screens, hooks, modals, PrimeReact components, and realtime connections must use the `"use client"` directive.
- **Strict TypeScript**: Never use `any`. Always declare precise types/interfaces in `src/types/`.

### 2.2 PrimeReact & UI System Standards
- Always reuse built-in PrimeReact components (`DataTable`, `Dialog`, `Button`, `Dropdown`, `Toast`, `Image`, `Calendar`, `FileUpload`, `ConfirmDialog`) and Tailwind CSS styling instead of writing ad-hoc custom UI elements.
- Always implement explicit states for **Loading** (`Skeleton`, `ProgressSpinner`, `loading` prop on buttons), **Empty State**, and **Error handling**.
- Destructive actions (delete, ban) must trigger a `confirmDialog`.

### 2.3 HTTP Client & Automatic Idempotency
- All API communication must go through `src/lib/fetchWrapper.ts`.
- **Automatic Idempotency**: All mutating HTTP requests (`POST`, `PUT`, `PATCH`, `DELETE`) automatically receive an `Idempotency-Key` header generated via `crypto.randomUUID()`.
- **Automatic Token Refresh**: 401 Unauthorized responses are intercepted by `fetchWrapper` to call `/auth/refresh` and retry the original request transparently.
- **Casing Normalization**: Backend PascalCase is automatically converted to frontend camelCase by `fetchWrapper`.

### 2.4 State Management, Caching & Realtime
- Use React Contexts (`AuthProvider`, `RootProvider`) for global application state.
- Use client-side caches (`profileCache`, `postCache`, `collectionCache`) with optimistic UI updates and error rollbacks.
- SignalR WebSockets (`chatHub`, `notificationHub`, `callHub`) maintain sticky connections through the NGINX Gateway.

---

## 3. Code Quality & Precision Standards
- User prefers analytical, system-level answers with complete listings instead of abbreviations or ellipsis (`...`).
- When updating planning/architecture documents, ensure the full end-to-end process is consistently documented.
