# Favi-FE Technical Documentation Index

Welcome to the comprehensive technical documentation for the **Favi Frontend (Favi-FE)** system — a modern social media user interface built on **Next.js 15 (App Router), React 19, TypeScript, PrimeReact, and Tailwind CSS**.

---

## Technical Documentation Directory

| # | Document | Detailed Description |
|---|---|---|
| **00** | [00_OVERVIEW_AND_FRONTEND_ARCHITECTURE.md](./00_OVERVIEW_AND_FRONTEND_ARCHITECTURE.md) | Next.js 15 App Router architecture, React 19 features, Server vs. Client Component boundaries, `src` folder structure. |
| **01** | [01_PAGES_ROUTING_AND_USER_JOURNEYS.md](./01_PAGES_ROUTING_AND_USER_JOURNEYS.md) | Comprehensive route map, user feature flows, and complete Admin Portal specification. |
| **02** | [02_LAYERS_STATE_MANAGEMENT_AND_DATA_FLOW.md](./02_LAYERS_STATE_MANAGEMENT_AND_DATA_FLOW.md) | Layered UI - Contexts - Custom Hooks - API Services - FetchWrapper architecture, client cache, and data conflict handling. |
| **03** | [03_IDEMPOTENCY_AND_HTTP_COMMUNICATION.md](./03_IDEMPOTENCY_AND_HTTP_COMMUNICATION.md) | Automatic `Idempotency-Key` generation, transparent 401 JWT token refresh loops, PascalCase ↔ camelCase transformations. |
| **04** | [04_REALTIME_WEBRTC_AND_EXTERNAL_INTEGRATIONS.md](./04_REALTIME_WEBRTC_AND_EXTERNAL_INTEGRATIONS.md) | SignalR WebSocket integration (Chat, Notifications, Call), WebRTC P2P video/audio calling, Supabase & Cloudinary media handling. |
| **05** | [05_VERSION_CONTROL_RELEASE_AND_STANDARDS.md](./05_VERSION_CONTROL_RELEASE_AND_STANDARDS.md) | Git conventions, `.env` environment variables, TypeScript strictness, bundle optimization, and production build pipelines. |
| **06** | [06_UI_SYSTEM_AND_COMPONENT_GUIDE.md](./06_UI_SYSTEM_AND_COMPONENT_GUIDE.md) | UI engineering guidelines with PrimeReact components, Tailwind CSS styling, Dialogs/Toasts, and Accessibility standards. |

---

## Mandatory Principles for Engineers & AI Agents

1. **Review Before Execution**: Before modifying any page, hook, or API service, consult the relevant technical documentation in this directory.
2. **Synchronous Documentation Updates**: Any changes to API endpoints, page layouts, authentication flows, or state architectures must be reflected in documentation within the same commit.
3. **UI/UX Consistency Standards**: Leverage standard PrimeReact components rather than custom reinvented controls; always include `Idempotency-Key` headers on state-mutating requests, and handle Loading, Empty, and Error states thoroughly.
