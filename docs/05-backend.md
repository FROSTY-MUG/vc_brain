# Backend Specifications

The Cognis backend handles the heavy lifting of user profiles, thesis configuration, messaging, and outbound sourcing ingestion. 

## Technology Choice
The backend is built with **FastAPI** (Python 3.12) to leverage its asynchronous capabilities, native Pydantic validation, and seamless integration with AI libraries.

## Core Services

### 1. API Routing Layer (`/routes`)
- `auth.py`: NextAuth token validation and Supabase bridging.
- `profile.py`: Profile saving, fetching, and updating.
- `thesis.py`: Investment thesis definitions and sector matching criteria.
- `sourcing.py`: Triggering background tasks to discover new outbound signals.

### 2. Data Persistence
All persistent data operations use the Supabase Python Client. 
- Models and schemas are strictly validated via Pydantic before reaching the database.
- Read operations are optimized to return immediately.

### 3. Edge Proxy Networking
Due to CORS policies and network boundary rules, the frontend (Vercel) does not talk to Railway directly from the client browser. Instead, all requests pass through Next.js API Routes (e.g., `src/app/api/profile/route.ts`), which in turn act as an internal proxy layer forwarding traffic securely to the Python backend endpoints.
