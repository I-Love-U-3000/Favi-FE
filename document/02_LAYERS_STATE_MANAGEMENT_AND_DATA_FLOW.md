# 02 — Frontend Layers, State Management & Data Flow (Favi-FE)

## 1. Application Layered Architecture

The project adheres to a clean, multi-layered architecture separating presentation concerns from network communications:

```
┌────────────────────────────────────────────────────────┐
│                   UI Layer (React 19)                  │
│       App Router Pages (src/app/[locale]/*)            │
│       Shared & Atomic Components (src/components/*)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Context & State Layer                  │
│      AuthProvider (User, Tokens, Permissions)          │
│      RootProvider (Modals, Dialogs, Global Toast)      │
│      Client Cache (ProfileCache, PostCache)            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Custom Hooks Layer                   │
│      useAuth, usePosts, useChat, useNotifications      │
│      (Business logic encapsulation, debounce, state)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Service / API Layer                  │
│      src/lib/api/* (postService, authService, etc.)    │
│      Defines contracts, endpoints, and parameters      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Network & Client Layer                 │
│      src/lib/fetchWrapper.ts                           │
│      - Automatic Idempotency-Key generation            │
│      - Transparent 401 interception & token refresh    │
│      - Bidirectional case normalization                │
└────────────────────────────────────────────────────────┘
```

---

## 2. Global State Management (Context Providers)

Rather than introducing heavy, boilerplate-laden state libraries (such as Redux), Favi-FE leverages purpose-built React Contexts:

### 2.1 `AuthProvider` (`src/components/AuthProvider.tsx`)
- Manages the authenticated user session (`currentUser: Profile | null`).
- Tracks authentication status (`isAuthenticated: boolean`, `isLoading: boolean`).
- Exposes authentication actions: `login(email, password)`, `logout()`, `updateProfile(data)`.
- Listens for the global browser event `"auth-token-expired"` dispatched by `fetchWrapper` to clean up local storage and navigate the user to `/login` when a session lapses.

### 2.2 `RootProvider` (`src/components/RootProvider.tsx`)
- Coordinates application-wide dialogs and overlays:
  - `isCreatePostOpen`: Opens/closes post creation modal globally (Navbar, keyboard shortcuts).
  - `isShareModalOpen`: Opens/closes post sharing modal.
  - `isImagePreviewOpen`: Controls fullscreen image lightbox views.
- Mounts PrimeReact's `Toast` container and exports the instance via `src/lib/toast.ts`, enabling any pure `.ts` utility to call `showToast.success(...)` or `showToast.error(...)` without needing React hook bindings.

---

## 3. Client-Side Caching

To ensure snappy page transitions and reduce unnecessary network calls to the backend, Favi-FE uses in-memory TTL-based cache utilities:

### 3.1 `profileCache.ts`
- Caches loaded user profile objects: `Map<userId, { profile, timestamp }>`.
- Allows `FeedCard` components to instantly display author avatars and display names without redundant profile lookup requests.

### 3.2 `postCache.ts` & `collectionCache.ts`
- Temporarily stores feed posts and collection details.
- When users navigate away and return, views render immediately from local cache while a background fetch updates state under a Stale-While-Revalidate pattern.

---

## 4. Concurrency Conflict Handling

When the backend detects a race condition or version mismatch (HTTP `409 Conflict`), `fetchWrapper` dispatches a Custom Event across the browser window:

```typescript
// Inside fetchWrapper.ts
if (res.status === 409 && typeof window !== "undefined") {
  window.dispatchEvent(new CustomEvent("favi-concurrency-conflict", { detail: thrownError }));
}
```

- Components or context listeners subscribe to this event:
  ```typescript
  window.addEventListener("favi-concurrency-conflict", (event) => {
    showToast.warn("This record is being modified in another session or an operation is in flight. Please refresh.");
  });
  ```
- This informs the user with actionable context instead of displaying a generic "An error occurred" message.
