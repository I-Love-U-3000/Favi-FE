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

---

## 5. Standard Error Envelope Parsing & Client Error Dispatch

When the backend returns an error response (`res.ok === false`), `fetchWrapper` intercepts the payload and parses the backend standard error envelope into a strongly-typed `ApiError` object:

```typescript
export interface ApiError {
  status: number;
  code?: string;
  message?: string;
  details?: string;
  error?: string;
}
```

### 5.1 Extraction & Logging Flow
```typescript
const thrownError: ApiError = {
  status: res.status,
  error: (apiError.error || apiError.message || "Request failed") as string,
  message: apiError.message as string | undefined,
  code: apiError.code as string | undefined,
  details: apiError.details as string | undefined,
};

if (res.status === 404) {
  console.debug(`[API 404] ${method} ${url} (Resource not found or private)`);
} else {
  console.error(`[API Error] ${method} ${url} failed with status ${res.status}:`, {
    code: thrownError.code,
    message: thrownError.message,
    details: thrownError.details,
    rawResponse: data
  });
}
```

### 5.2 Global Custom Events on Specific Error Codes
- **`CONCURRENCY_CONFLICT` / HTTP 409**:
  ```typescript
  if (res.status === 409 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("favi-concurrency-conflict", { detail: thrownError }));
  }
  ```
  Components and contexts listen for this event to render non-intrusive warnings prompting the user to refresh their view rather than crashing.
- **`auth-token-expired` / HTTP 401**:
  When refresh token calls fail, `fetchWrapper` clears credentials from `localStorage` and emits `new Event("auth-token-expired")` to redirect the user to `/login`.
- **UI Error Feedback (Toasts)**:
  Components pass `thrownError.message` or `thrownError.code` into `showToast.error(thrownError.message || "Operation failed")` from `src/lib/toast.ts` to surface user-friendly notifications.

---

## 6. Progressive Outbound Retry Policy (Client Fault Tolerance)

To withstand transient network drops, gateway failovers, and server blips, `fetchWrapper` incorporates an automated progressive retry mechanism for all outbound requests.

```
Outgoing Request
      │
      ▼
┌───────────────┐
│ fetch(url)    │
└───────┬───────┘
        │
        ├──▶ Success (2xx) ──────────────────────────▶ Return response (0 retries)
        │
        ├──▶ HTTP 404 (Not Found) ───────────────────▶ Reject immediately (Excluded from retries)
        │
        ├──▶ HTTP 401 (Unauthorized) ────────────────▶ Token Refresh & Replay (tryRefreshAndRetry)
        │
        └──▶ Any Failure (Network Error, 5xx, 4xx) ──▶ Retry Pipeline:
                                                        │
                                                        ├── Attempt 1: Immediate retry (0s delay)
                                                        ├── Attempt 2: Wait 5 seconds
                                                        ├── Attempt 3: Wait 10 seconds
                                                        └── Attempt N+: Wait max 15 seconds
```

### 6.1 Exclusion Rules
1. **HTTP 404 Not Found**: A 404 indicates a missing resource (e.g., deleted post or non-existent profile). Retrying would be redundant and wasteful.
2. **HTTP 401 Unauthorized**: Handled exclusively through the dedicated `tryRefreshAndRetry()` workflow. If the refresh token is invalid or expired, further retries are terminated to prevent authentication loops.

### 6.2 Progressive Delay Schedule
The retry delay is computed using the `calculateRetryDelay` function:
```typescript
export function calculateRetryDelay(retryCount: number): number {
  if (retryCount <= 1) return 0;
  return Math.min((retryCount - 1) * 5000, 15000);
}
```

| Attempt | Nature | Delay Before Dispatch | Cumulative Elapsed |
|:---:|---|:---:|:---:|
| **Initial** | First outbound execution | 0 ms | 0 ms |
| **Retry 1** | Immediate recovery | **0 ms** | 0 ms |
| **Retry 2** | First backoff | **5,000 ms (5s)** | ~5s |
| **Retry 3** | Second backoff | **10,000 ms (10s)** | ~15s |
| **Subsequent** | Sustained recovery *(if configured)* | **15,000 ms (15s max)** | +15s each |

### 6.3 Idempotency Key Consistency Across Retries
For state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`), the `Idempotency-Key` header generated on the initial attempt is **preserved unchanged across all retry attempts**. If the initial request succeeded on the backend but the response was lost due to network disruption, subsequent retries hit backend `IdempotencyMiddleware` and receive the cached result without creating duplicate records or executing redundant side effects.

### 6.4 Dynamic Token Synchronization
Before dispatching each retry attempt, `request()` dynamically reads `localStorage.getItem("access_token")`. If another concurrent request refreshed the access token during a retry backoff interval, the retried request automatically picks up and attaches the renewed bearer token.
