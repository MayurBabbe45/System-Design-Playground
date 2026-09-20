# Phase 8 Plan: Authentication System & Session Management

## Objective
Implement a secure, modern authentication system and session management layer for **System Design Playground**:
1. Support Email + Password registration and login via the Express API backend.
2. Provide a frictionless **"Continue as Guest / Demo Mode"** option for immediate zero-credential exploration.
3. Manage user identity, JWT tokens, and persistence via Zustand (`useAuthStore`) and `localStorage`.
4. Inject authentication headers into all client API requests to link projects and telemetry with the active user.

---

## Deliverables

### 1. Client Auth Store (`src/store/useAuthStore.ts`)
- State: `user: { id: string; name: string; email: string } | null`, `token: string | null`, `isAuthenticated: boolean`, `isGuest: boolean`, `isLoading: boolean`.
- Actions:
  - `login(email, password)`: calls `/api/auth/login`, stores JWT, sets user.
  - `register(email, password, name)`: calls `/api/auth/register`, stores JWT, sets user.
  - `continueAsGuest()`: creates anonymous guest session, allows immediate dashboard access.
  - `logout()`: clears JWT, resets store state, redirects to auth screen.
  - `initAuth()`: validates stored JWT via `/api/auth/me` on startup.

### 2. Modern Glassmorphic Auth Screen (`src/components/auth/AuthScreen.tsx`)
- n8n / Supabase styled authentication interface.
- Tab toggle between **Sign In** and **Create Account**.
- Clean inputs with icons: Name (on signup), Email, and Password.
- Error alerts and loading indicators.
- Quick **"Continue as Guest"** bypass card with explanatory note.
- Full Light and Dark mode theme compliance.

### 3. API Client Authentication Integration (`src/api/client.ts`)
- Automatically reads JWT from `useAuthStore` or `localStorage` and appends `Authorization: Bearer <token>` to all HTTP requests.
- Handles 401 Unauthorized responses cleanly by clearing session and redirecting to auth.

---

## Verification Criteria
1. User can register a new account via email and password, receiving a valid JWT.
2. User can log out and log back in with the same credentials.
3. User can click "Continue as Guest" and bypass login into the Dashboard.
4. Token persists across browser reloads and restores authenticated session seamlessly.
