# 04 — Realtime (SignalR), WebRTC & Cloud Integrations (Favi-FE)

## 1. SignalR WebSockets Integration

Favi-FE utilizes `@microsoft/signalr` to maintain bidirectional real-time channels with the backend across 3 specialized Hubs:

```
[ Frontend Client ]
        │
        ├──▶ /chatHub          (Direct messages, typing indicators, read receipts)
        ├──▶ /notificationHub  (Engagement notifications: Likes, Comments, Follows, System alerts)
        └──▶ /callHub          (WebRTC voice and video call signaling channel)
```

### 1.1 Connection Setup & NGINX Sticky Session Compatibility
To ensure persistent connections avoid handoff issues across multi-node load-balanced clusters:
1. The client configures `HubConnectionBuilder`:
   ```typescript
   import * as signalR from "@microsoft/signalr";

   const connection = new signalR.HubConnectionBuilder()
     .withUrl(`${process.env.NEXT_PUBLIC_API_URL}/chatHub`, {
       accessTokenFactory: () => localStorage.getItem("access_token") || "",
       transport: signalR.HttpTransportType.WebSockets // Prioritizes native WebSockets
     })
     .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Reconnection backoff policy
     .build();
   ```
2. By virtue of the Gateway's `ip_hash` configuration, the initial HTTP `/negotiate` step and subsequent WebSocket handshake consistently target the identical backend replica.

---

## 2. WebRTC Peer-to-Peer Calling Architecture

The platform supports browser-native 1-on-1 audio and video calling leveraging WebRTC peer connections coordinated via SignalR `/callHub` as the signaling plane:

```
User A (Caller)                     SignalR /callHub                     User B (Callee)
      │                                    │                                    │
      │── 1. Send 'CallUser' (Offer SDP) ─▶│                                    │
      │                                    │── 2. Forward 'IncomingCall' ──────▶│
      │                                    │                                    │
      │                                    │◀── 3. Accept 'AnswerCall' (SDP) ───│
      │◀── 4. Receive 'CallAccepted' ──────│                                    │
      │                                    │                                    │
      │── 5. Exchange ICE Candidates ─────▶│── 5. Exchange ICE Candidates ─────▶│
      │◀──    (Network topologies)      ───│◀──    (Network topologies)      ───│
      │                                    │                                    │
      ▼═════════════════════════════════════════════════════════════════════════▼
                         [ Direct P2P Audio/Video Stream ]
```

- Peer connection lifecycles, media stream capture, and device permission management reside in `src/lib/webrtc/`.

---

## 3. External Cloud Service Integrations

### 3.1 Multimedia Storage: Supabase Storage & Cloudinary
- **Post media and high-resolution assets**: Uploaded and served via Cloudinary or Supabase Storage buckets.
- **Image Optimization & Delivery**:
  - Automatic format negotiation to `WebP` or `AVIF`, trimming network payloads by 40–60%.
  - On-the-fly CDN transformation parameters for responsive screen density sizing (thumbnails, feed cards, fullscreen previews).

### 3.2 Geocoding & Location Suggestions: LocationIQ
- Post creation (`CreatePostModal`) integrates LocationIQ's Autocomplete API.
- Allows users to search locations, tagging coordinates (`latitude`, `longitude`) alongside human-readable place names.
