# Project Architecture

Cognis leverages a decoupled frontend/backend architecture designed for ultra-low latency and scalable data streaming.

## High-Level Topology

```
[ Client Browser ]
        |
        v
[ Vercel Edge Network ] (Frontend Hosting)
        |
        +---> /api/* (Next.js Edge Functions / Proxies)
        |
        v
[ Railway Infrastructure ] (Backend Hosting)
        |
        +---> FastAPI (Python 3.12 Backend Server)
        |
        v
[ Supabase ] (PostgreSQL & Storage)
```

## Key Architectural Decisions
1. **Frontend-First Caching**: The UI immediately loads data from `localStorage` on mount to ensure sub-second rendering. Real-time background loops then silently fetch fresh data and overwrite the local cache, delivering an "instant-on" feel.
2. **Reverse Proxying**: Because Next.js reserves `/api/` for its own serverless route handlers, all Python backend traffic is proxied via Next.js rewriting to `/py-api/`, abstracting CORS issues and ensuring a unified domain.
3. **Decoupled Persistence**: Moved away from a local SQLite implementation to Supabase to support horizontal scaling across Vercel and Railway edge environments.
4. **WebSocket Streaming**: Radar signals use WebSocket connections to maintain live telemetry without excessive HTTP overhead.
