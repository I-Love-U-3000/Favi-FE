# 00 — Frontend Architecture Overview (Favi-FE)

## 1. Technology Stack

Favi's frontend is built upon a modern, robust web application stack:
- **Framework**: [Next.js 15](https://nextjs.org/) utilizing the **App Router** architecture.
- **UI Library**: [React 19](https://react.dev/) integrated with [PrimeReact](https://primereact.org/) for rich component primitives (Forms, DataTables, Dialogs, Charts).
- **Language**: TypeScript 5 (Strict Mode).
- **Styling**: Tailwind CSS combined with PrimeFlex and CSS Modules for responsive layouts and maintainability.
- **Internationalization (i18n)**: `next-intl` supporting locale-based dynamic routing (`[locale]`: Vietnamese, English, etc.).
- **Realtime Communication**: `@microsoft/signalr` managing persistent WebSocket connections to Backend Hubs.

---

## 2. Project Anatomy

All primary source code is housed within `favi-fe/src`:

```
favi-fe/
├── messages/                   # Internationalization localization dictionaries (vi.json, en.json)
├── public/                     # Static media assets, icons, logos
├── src/
│   ├── app/                    # Next.js 15 App Router directory
│   │   ├── [locale]/           # Dynamic localization route segment
│   │   │   ├── (auth)/         # Authentication route group (login, register, forgot-password)
│   │   │   ├── admin/          # Comprehensive Admin Portal interface
│   │   │   ├── chat/           # Direct 1-on-1 and group messaging views
│   │   │   ├── collections/    # User post collections & boards
│   │   │   ├── friends/        # Followers, following & friend recommendation lists
│   │   │   ├── home/           # Main personalized feed & ephemeral 24h stories
│   │   │   ├── notifications/  # Notification center & activity history
│   │   │   ├── posts/[id]/     # Deep-linked post view & hierarchical comment tree
│   │   │   ├── profile/[id]/   # User profile pages & gallery grids
│   │   │   ├── search/         # AI Multimodal Semantic Search & keyword query interface
│   │   │   ├── settings/       # Account preferences, privacy & appearance settings
│   │   │   ├── layout.tsx      # Root Layout (wrapping AuthProvider, PrimeReactProvider)
│   │   │   └── page.tsx        # Root redirect page
│   │   └── middleware.ts       # Locale negotiation & authenticated route protection
│   ├── components/             # Reusable UI component catalog
│   │   ├── AuthProvider.tsx    # Auth session lifecycle & User Profile Context
│   │   ├── RootProvider.tsx    # Global modals, dialogs & toast container
│   │   ├── Navbar.tsx          # Main navigation sidebar and responsive header
│   │   ├── FeedCard.tsx        # Feed post presentation card
│   │   ├── Post.tsx            # Full-featured post detail renderer
│   │   └── ...                 # Modal dialogs (Create Post, Edit Profile, Share Dialog)
│   ├── hooks/                  # Custom React hooks
│   ├── i18n/                   # Routing and request configuration for next-intl
│   ├── lib/                    # Services, utilities & HTTP client abstraction
│   │   ├── api/                # Domain-scoped API modules communicating with backend
│   │   ├── cache/              # Client-side cache (ProfileCache, PostCache, CollectionCache)
│   │   ├── fetchWrapper.ts     # HTTP wrapper (Idempotency, Auto Token Refresh, Case Mapping)
│   │   ├── toast.ts            # Global toast dispatching utility
│   │   └── webrtc/             # P2P audio/video WebRTC connection managers
│   ├── theme/                  # PrimeReact styling themes & custom design tokens
│   └── types/                  # Strict TypeScript interface contracts (User, Post, Comment,...)
```

---

## 3. Server Components vs. Client Components Boundaries

Next.js 15 defaults all files in the `app` directory to React Server Components (RSC). Favi-FE enforces strict guidelines governing client/server component partitioning:

### 3.1 Server Components (RSC)
- **Applied to**: Layout wrappers (`layout.tsx`), static SEO shell pages, and initial metadata generators.
- **Benefits**: Optimized search engine indexing, zero client JavaScript bundle overhead for layout frames, and faster First Contentful Paint (FCP).

### 3.2 Client Components (`"use client"`)
- **Applied to**:
  - Interactive pages and components: Click events, hover states, form inputs, modals, and slide-overs.
  - Components utilizing React Hooks: `useState`, `useEffect`, `useContext`, `useCallback`, `useRef`.
  - PrimeReact controls with event handlers (`DataTable`, `Dialog`, `Dropdown`, `Toast`).
  - Persistent real-time connections (`SignalR`) and WebRTC peer streams.
- **Rule**: Place the `"use client"` directive on line 1. Keep Client Components at the leaves of the render tree wherever feasible to maximize the portion of the tree rendered on the server.
