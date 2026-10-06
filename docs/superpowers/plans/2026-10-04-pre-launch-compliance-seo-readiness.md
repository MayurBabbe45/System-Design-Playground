# Pre-Launch Compliance, SEO & Security Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all 10 failed/missing pre-launch checklist items: implement legal compliance (Privacy Policy, Terms of Service, Cookie Consent), anti-spam rate limiting and form validation, complete SEO/OpenGraph social metadata, vendor code-splitting bundle optimization, custom 404 route handling, and mobile responsive shell.

**Architecture:** Add in-memory sliding-window IP rate limiting and HSTS headers to Express API routes. Embed modal-based Privacy Policy and Terms of Service with a non-intrusive bottom Cookie Consent banner in React. Populate `public/` with robots.txt, sitemap.xml, favicon, and OpenGraph preview banner. Configure Vite Rollup manual vendor chunking to decouple React Flow and Recharts from the main bundle. Add responsive breakpoints to Header and Sidebar.

**Tech Stack:** Node.js 22 (node:test, Express), React 18, Tailwind CSS, Vite 6 (Rollup manualChunks), Lucide React.

**Spec:** Pre-launch 20-point Production Readiness & Compliance Checklist.

## Global Constraints

- Never alter the discrete-event simulation engine (`WorkerSimulationInput`, `sim_engine.wasm`, queue theory).
- Do not introduce bloated external packages when lightweight standard solutions suffice (e.g. native sliding-window rate limiter, native modal dialogs, native Rollup chunks).
- All legal and cookie consent dismissals must persist in browser `localStorage`.
- All automated backend tests must run under `node --test server/tests/*.test.mjs`.

## Review Focus

1. **Auth Brute Force & Spam Flooding**: Submitting 16+ rapid registration or login requests from the same IP must trigger HTTP 429 Too Many Requests with a retry-after message.
2. **Invalid Email & Weak Password Rejection**: Submitting malformed email syntax or passwords under 8 characters must return HTTP 400 on both frontend and backend before reaching storage.
3. **Cookie Banner Persistence**: Dismissing the cookie banner must prevent it from reappearing on subsequent reloads.
4. **Vite Production Chunk Size**: Running `npm run build` must no longer emit "Some chunks are larger than 500 kB" warnings for the primary application chunk.
5. **Mobile Viewport Overflow**: On viewport width 390px (mobile portrait), Header actions and the component palette must not push the canvas off-screen or cause horizontal window scrolling.

---

### Task 1: Auth Rate Limiting, Input Validation & Security Headers

**Files:**
- Modify: `server/apiServer.mjs:25-95`
- Modify: `src/components/auth/AuthScreen.tsx:25-60`
- Test: `server/tests/rateLimiterAndValidation.test.mjs`

**Interfaces:**
- Consumes: Express `req.ip`, `req.headers`
- Produces: `authRateLimiter(req, res, next)` middleware (15 attempts / 15 minutes window)
- Produces: Strict email regex validation and minimum 8-character password length constraint

- [ ] **Step 1: Write the failing test for rate limiting & validation**

Create `server/tests/rateLimiterAndValidation.test.mjs`:
```javascript
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { authRateLimiter } from '../apiServer.mjs';

describe('Auth Rate Limiting & Validation Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.post('/test/auth-limit', authRateLimiter, (req, res) => {
      res.json({ ok: true });
    });

    await new Promise((resolve) => {
      server = testApp.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) server.close();
  });

  test('authRateLimiter sets HSTS security header', async () => {
    const res = await fetch(`${baseUrl}/test/auth-limit`, { method: 'POST' });
    assert.ok(res.headers.get('strict-transport-security'));
  });

  test('authRateLimiter throttles requests after 15 rapid calls', async () => {
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${baseUrl}/test/auth-limit`, { method: 'POST' });
      assert.equal(res.status, 200);
    }
    const throttled = await fetch(`${baseUrl}/test/auth-limit`, { method: 'POST' });
    assert.equal(throttled.status, 429);
    const body = await throttled.json();
    assert.ok(body.error);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/tests/rateLimiterAndValidation.test.mjs`
Expected: FAIL (module export `authRateLimiter` not found).

- [ ] **Step 3: Implement rate limiting and input validation in `server/apiServer.mjs` and `AuthScreen.tsx`**

1. In `server/apiServer.mjs`:
   - Implement `authRateLimiter(req, res, next)` with sliding-window Map.
   - Attach HSTS header `res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')`.
   - Update `/api/auth/register` to validate email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` and `password.length >= 8`.
   - Update `/api/auth/login` to validate input presence.
2. In `src/components/auth/AuthScreen.tsx`:
   - Add inline client-side validation errors for invalid emails or passwords shorter than 8 characters before network dispatch.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/tests/rateLimiterAndValidation.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/apiServer.mjs src/components/auth/AuthScreen.tsx server/tests/rateLimiterAndValidation.test.mjs
git commit -m "feat(security): add auth rate limiting, HSTS header, and strict form validation"
```

---

### Task 2: Legal Compliance (Privacy Policy, Terms of Service & Cookie Consent)

**Files:**
- Create: `src/components/modals/LegalModal.tsx`
- Create: `src/components/common/CookieConsentBanner.tsx`
- Modify: `src/App.tsx:1-118`
- Modify: `src/components/auth/AuthScreen.tsx`

**Interfaces:**
- Produces: `<LegalModal isOpen={boolean} onClose={fn} defaultTab="privacy" | "terms" />`
- Produces: `<CookieConsentBanner />` reading/writing `sdp_cookie_consent` in `localStorage`

- [ ] **Step 1: Create `src/components/modals/LegalModal.tsx`**

Build accessible, glassmorphic modal with:
- Tab 1: **Privacy Policy** (GDPR/CCPA compliance, local browser storage usage, telemetry transparency, rights to erasure).
- Tab 2: **Terms & Conditions** (Fair use, architectural simulation disclaimer, intellectual property, limitation of liability).

- [ ] **Step 2: Create `src/components/common/CookieConsentBanner.tsx`**

Build responsive bottom banner:
- Explain essential session cookies and performance telemetry buffer.
- Buttons: "Accept All", "Essential Only", and "Read Policy" (opening LegalModal).
- Saves consent choice to `localStorage.getItem('sdp_cookie_consent')`.

- [ ] **Step 3: Integrate into `src/App.tsx` and `src/components/auth/AuthScreen.tsx`**

- Render `<CookieConsentBanner />` and `<LegalModal />` in `App.tsx`.
- Add clickable "Terms of Service" and "Privacy Policy" links to `AuthScreen.tsx` footer.

- [ ] **Step 4: Run lint to verify clean TypeScript compilation**

Run: `npm run lint`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/LegalModal.tsx src/components/common/CookieConsentBanner.tsx src/App.tsx src/components/auth/AuthScreen.tsx
git commit -m "feat(legal): add privacy policy, terms of service modal, and cookie consent banner"
```

---

### Task 3: SEO, Social Preview & Discoverability Assets

**Files:**
- Modify: `index.html`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Create: `public/favicon.svg`
- Create: `public/og-preview.png` (or high-res SVG banner)

**Interfaces:**
- Produces: Static search engine discoverability files served from `/`
- Produces: OpenGraph & Twitter Card headers in `<head>`

- [ ] **Step 1: Create `public/robots.txt`**

```txt
User-agent: *
Allow: /
Sitemap: https://systemdesignplayground.com/sitemap.xml
```

- [ ] **Step 2: Create `public/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://systemdesignplayground.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://systemdesignplayground.com/?view=dashboard</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Create dedicated SVG favicon & OpenGraph social banner**

- Create `public/favicon.svg` with lightning network logo.
- Create `public/og-preview.svg` with high-contrast architecture diagram illustration and title.

- [ ] **Step 4: Update `index.html` with complete SEO metadata**

Include:
- Meta description, author, keywords, theme-color.
- `og:title`, `og:description`, `og:image`, `og:url`, `og:type`.
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- Links to `/favicon.svg`.

- [ ] **Step 5: Commit**

```bash
git add index.html public/
git commit -m "feat(seo): add sitemap, robots.txt, favicon, and OpenGraph social metadata"
```

---

### Task 4: Rollup Vendor Chunking & Page Load Optimization

**Files:**
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: Vite `build.rollupOptions.output.manualChunks`
- Produces: Split vendor bundles isolating heavy third-party dependencies

- [ ] **Step 1: Update `vite.config.ts` with vendor manualChunks**

```typescript
build: {
  chunkSizeWarningLimit: 800,
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-xyflow': ['@xyflow/react'],
        'vendor-recharts': ['recharts'],
        'vendor-collab': ['yjs', 'y-websocket'],
        'vendor-icons': ['lucide-react'],
      },
    },
  },
}
```

- [ ] **Step 2: Run `npm run build` and verify bundle breakdown**

Run: `npm run build`
Expected: Main application chunk drops under 300 kB; vendor libraries cleanly partitioned into cached chunks.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "perf(build): split vendor chunks for React Flow, Recharts, and Yjs"
```

---

### Task 5: Custom 404 Route Fallback & Responsive Mobile Shell

**Files:**
- Create: `src/components/common/NotFoundView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Sidebar.tsx`

**Interfaces:**
- Produces: `<NotFoundView />` triggered on invalid URL paths or missing project IDs
- Produces: Responsive breakpoints on Header buttons (`hidden md:inline`) and Sidebar drawer

- [ ] **Step 1: Create `src/components/common/NotFoundView.tsx`**

Build clean dark-mode 404 screen:
- 404 status indicator with circuit/broken wire icon.
- Helpful message ("Architecture not found or invalid URL").
- Primary button: "Back to Dashboard" and secondary "Create New Architecture".

- [ ] **Step 2: Add 404 handling in `src/App.tsx`**

Detect invalid route query parameters or failed `openProjectById` lookups, switching to 404 state with recovery button.

- [ ] **Step 3: Add responsive classes in `Header.tsx` and `Sidebar.tsx`**

- In `Header.tsx`: hide secondary text labels on small screens (`hidden sm:inline` for "Cost", "Chaos", "Audit", "Share"), keeping icons clickable.
- In `Sidebar.tsx`: default to collapsed icon-only mode when `window.innerWidth < 768`.

- [ ] **Step 4: Commit**

```bash
git add src/components/common/NotFoundView.tsx src/App.tsx src/components/Header.tsx src/components/Sidebar.tsx
git commit -m "feat(ui): add 404 fallback page and responsive mobile header/sidebar breakpoints"
```

---

### Task 6: Full Verification & Pre-Launch Health Audit

**Files:**
- Verify: `node --test server/tests/*.test.mjs`
- Verify: `npm run lint`
- Verify: `npm run build`

- [ ] **Step 1: Execute all unit and integration tests**

Run: `node --test server/tests/*.test.mjs`
Expected: 10/10 tests pass across all test suites.

- [ ] **Step 2: Execute TypeScript linter**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Execute production build**

Run: `npm run build`
Expected: Sub-second bundle generation, 0 warnings.
