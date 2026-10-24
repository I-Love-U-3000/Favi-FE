# 03 — Client-Side Idempotency, Authentication & HTTP Protocols (Favi-FE)

## 1. Automated `Idempotency-Key` Generation

One of the foundational architectural tenets of Favi-FE is **guaranteeing client-side idempotency across all state-mutating HTTP operations**.
This behavior is encapsulated in `src/lib/fetchWrapper.ts`.

### 1.1 Implementation Architecture
Whenever frontend code invokes mutating network methods:
```typescript
fetchWrapper.post(url, body)
fetchWrapper.put(url, body)
fetchWrapper.patch(url, body)
fetchWrapper.del(url, body)
```

`fetchWrapper` automatically inspects the verb and generates a fresh unique identifier:
```typescript
const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
const idempotencyKey = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const headers: Record<string, string> = {
  ...(auth ? getAuthHeaders() : {}),
  ...(isFormData ? {} : { "Content-Type": "application/json" }),
  ...(isMutating ? { "Idempotency-Key": idempotencyKey } : {}),
};
```

### 1.2 Architectural Benefits
- **Zero Developer Overhead**: Form submissions, reaction toggles, and comment posts are transparently protected against double-clicking, browser lag, and network retries without manual key passing.
- **Flawless Backend Integration**: The backend `IdempotencyMiddleware` requires an `Idempotency-Key` on all mutating routes under `/api/`; automating this at the client wrapper ensures requests never fail with `400 MISSING_IDEMPOTENCY_KEY`.

---

## 2. JWT Authentication Lifecycle & Transparent Token Refresh

The application employs a dual **JWT Access Token + Refresh Token** lifecycle:
- `access_token`: Short lifespan (60 minutes), forwarded via `Authorization: Bearer <token>`.
- `refresh_token`: Long lifespan (7 days), stored securely to request renewed credentials when the access token lapses.

```
[ Outgoing Request ] ──▶ Backend returns 401 Unauthorized (Expired Token)
                               │
                               ▼
                [ tryRefreshAndRetry Interceptor ]
                               │
                 Reads refresh_token from localStorage
                               │
                               ▼
                Calls POST /auth/refresh (Body: refresh_token)
                               │
              ┌────────────────┴────────────────┐
              │ (Success)                       │ (Failure / Session Expired)
              ▼                                 ▼
       Stores new access_token           Clears localStorage completely
       Stores new refresh_token          Dispatches 'auth-token-expired' event
       Replays original request          Redirects user to /login
       and returns result to caller      Shows toast: "Session expired. Please log in again."
```

### Refresh Implementation in `fetchWrapper.ts`:
```typescript
if (res.status === 401 && auth) {
  try {
    return await tryRefreshAndRetry<T>(url, init);
  } catch (err: unknown) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.dispatchEvent(new Event("auth-token-expired"));
    }
    throw err;
  }
}
```

---

## 3. Bidirectional Casing Normalization (PascalCase ↔ camelCase)

### 3.1 Cross-Platform Friction
- Backend C# / .NET models adhere to `PascalCase` (`CreatedAt`, `UserProfile`, `LikeCount`).
- Frontend TypeScript / React conventions demand idiomatic `camelCase` (`createdAt`, `userProfile`, `likeCount`).

### 3.2 Automated Normalization in `handleResponse`
`fetchWrapper` automatically and recursively normalizes all object and array keys received from the backend into idiomatic `camelCase` prior to returning data to components:

```typescript
function toCamelCase(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    acc[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
    return acc;
  }, {} as Record<string, unknown>);
}
```
This frees frontend engineers to write natural TypeScript code without boilerplate mapper functions.

---

## 4. Multipart Media Uploads (FormData Handling)

When transmitting media binaries or multipart form payloads:
- `fetchWrapper` detects `body instanceof FormData`.
- **Strict Rule: Never explicitly set `Content-Type: application/json` or `Content-Type: multipart/form-data` manually**. The browser must generate this header automatically along with the required multi-segment boundary string to ensure accurate payload parsing on the server.
