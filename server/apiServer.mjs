import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  initPostgres, 
  createUser, 
  ensureGuestUser,
  findUserByEmail, 
  findUserById, 
  saveArchitecture, 
  listArchitectures, 
  getArchitectureById, 
  updateArchitecture, 
  deleteArchitecture, 
  forkArchitecture 
} from './db/postgres.mjs';
import { 
  initClickHouse, 
  ingestTelemetryBatch, 
  queryTelemetryAnalytics 
} from './db/clickhouse.mjs';

import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.API_PORT || 4000;
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable must be defined in production.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'system-design-playground-jwt-secret-key-2026';

export const app = express();

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
];

const envOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : [];

const allowedOrigins = [...defaultOrigins, ...envOrigins];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, whitelist matches, or any localhost port in development
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
    ) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));

// Graph size upper bounds to protect against denial-of-service / memory exhaustion
export const MAX_GRAPH_NODES = 1000;
export const MAX_GRAPH_EDGES = 2000;

// Auth Rate Limiting Middleware (15 requests per 15 minutes window)
const authAttempts = new Map();
const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_MAX_ATTEMPTS = 15;

export function resetAuthRateLimits() {
  authAttempts.clear();
}

export function authRateLimiter(req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowStart = now - AUTH_RATE_WINDOW_MS;

  // Evict expired tracking entries to avoid heap leak
  for (const [key, times] of authAttempts.entries()) {
    const valid = times.filter((t) => t > windowStart);
    if (valid.length === 0) {
      authAttempts.delete(key);
    } else {
      authAttempts.set(key, valid);
    }
  }

  const timestamps = authAttempts.get(ip) || [];

  if (timestamps.length >= AUTH_RATE_MAX_ATTEMPTS) {
    return res.status(429).json({
      error: 'Too many authentication attempts. Please try again after 15 minutes.'
    });
  }

  timestamps.push(now);
  authAttempts.set(ip, timestamps);
  next();
}

// Strict Auth Token Middleware for protected operations
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

// Optional Auth Middleware for public endpoints
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : req.cookies?.token;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    postgresMode: process.env.DATABASE_URL ? 'PostgreSQL Native' : 'Embedded SQL Relational',
    clickhouseMode: process.env.CLICKHOUSE_URL ? 'ClickHouse Native' : 'Embedded Columnar Buffer',
  });
});

// --- Auth Routes ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/auth/register', authRateLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email: cleanEmail, passwordHash, name: cleanName });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('[API] Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = { id: user.id, email: user.email, name: user.name };
    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('[API] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  res.json({ user: user || req.user });
});

// Guest Session Route (Zero-friction instant JWT issuance for playground exploration)
app.post('/api/auth/guest', async (req, res) => {
  try {
    const requestedId = req.body?.guestId;
    const user = await ensureGuestUser(requestedId);
    const safeUser = { id: user.id, email: user.email, name: user.name, isGuest: true };
    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('[API] Guest auth error:', err);
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

// --- Architecture Routes ---

// List architectures (optionalAuth: public list if unauthenticated, plus user architectures if logged in)
app.get('/api/architectures', optionalAuth, async (req, res) => {
  try {
    const publicOnly = req.query.publicOnly === 'true' || !req.user;
    const list = await listArchitectures({ userId: req.user ? req.user.id : null, publicOnly });
    res.json({ architectures: list });
  } catch (err) {
    console.error('[API] List architectures error:', err);
    res.status(500).json({ error: 'Failed to fetch architectures' });
  }
});

// Save new architecture (optionalAuth: supports both authenticated users and guest sessions)
app.post('/api/architectures', optionalAuth, async (req, res) => {
  try {
    const { name, description, nodes, edges, chaos, grade, monthlyCost, isPublic } = req.body;
    if (!name || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({ error: 'Name, nodes array, and edges array are required' });
    }

    if (nodes.length > MAX_GRAPH_NODES || edges.length > MAX_GRAPH_EDGES) {
      return res.status(400).json({
        error: `Graph payload exceeds maximum permitted size (limit: ${MAX_GRAPH_NODES} nodes, ${MAX_GRAPH_EDGES} edges)`
      });
    }

    let userId = req.user ? req.user.id : null;
    if (!userId) {
      const guest = await ensureGuestUser();
      userId = guest.id;
    }

    const saved = await saveArchitecture({
      userId,
      name,
      description,
      nodes,
      edges,
      chaos,
      grade,
      monthlyCost,
      isPublic: isPublic !== false,
    });

    res.status(201).json({ architecture: saved });
  } catch (err) {
    console.error('[API] Save architecture error:', err);
    res.status(500).json({ error: 'Failed to save architecture' });
  }
});

// Get architecture by ID
app.get('/api/architectures/:id', async (req, res) => {
  try {
    const arch = await getArchitectureById(req.params.id);
    if (!arch) {
      return res.status(404).json({ error: 'Architecture not found' });
    }
    res.json({ architecture: arch });
  } catch (err) {
    console.error('[API] Get architecture error:', err);
    res.status(500).json({ error: 'Failed to retrieve architecture' });
  }
});

// Update architecture
app.put('/api/architectures/:id', requireAuth, async (req, res) => {
  try {
    const updated = await updateArchitecture(req.params.id, req.user.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Architecture not found or unauthorized' });
    }
    res.json({ architecture: updated });
  } catch (err) {
    console.error('[API] Update architecture error:', err);
    res.status(500).json({ error: 'Failed to update architecture' });
  }
});

// Delete architecture
app.delete('/api/architectures/:id', requireAuth, async (req, res) => {
  try {
    const success = await deleteArchitecture(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Architecture not found or unauthorized' });
    }
    res.json({ success: true, message: 'Architecture deleted successfully' });
  } catch (err) {
    console.error('[API] Delete architecture error:', err);
    res.status(500).json({ error: 'Failed to delete architecture' });
  }
});

// Fork architecture
app.post('/api/architectures/:id/fork', requireAuth, async (req, res) => {
  try {
    const { newName } = req.body;
    const forked = await forkArchitecture(req.params.id, req.user.id, newName);
    if (!forked) {
      return res.status(404).json({ error: 'Source architecture not found' });
    }
    res.status(201).json({ architecture: forked });
  } catch (err) {
    console.error('[API] Fork architecture error:', err);
    res.status(500).json({ error: 'Failed to fork architecture' });
  }
});

// --- ClickHouse Telemetry Routes ---

// Ingest high-throughput telemetry batch from simulation
app.post('/api/telemetry/ingest', async (req, res) => {
  try {
    const { ticks } = req.body;
    if (!Array.isArray(ticks)) {
      return res.status(400).json({ error: 'ticks array required' });
    }
    const result = await ingestTelemetryBatch(ticks);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[API] Telemetry ingest error:', err);
    res.status(500).json({ error: 'Failed to ingest telemetry batch' });
  }
});

// Query analytical telemetry rollups (p50/p90/p99 latency, queue depth, throughput)
app.get('/api/telemetry/analytics', async (req, res) => {
  try {
    const { architectureId, timeWindowMinutes } = req.query;
    const analytics = await queryTelemetryAnalytics({
      architectureId: architectureId || null,
      timeWindowMinutes: Number(timeWindowMinutes) || 60,
    });
    res.json({ analytics });
  } catch (err) {
    console.error('[API] Telemetry analytics query error:', err);
    res.status(500).json({ error: 'Failed to compute telemetry analytics' });
  }
});

// Start Express Server
export async function startServer() {
  await initPostgres();
  await initClickHouse();

  return new Promise((resolve) => {
    const srv = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Express API] System Design Playground API running on http://localhost:${PORT}`);
      resolve(srv);
    });
  });
}

const isDirectExecution = process.argv[1] && (
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  process.argv[1].endsWith('apiServer.mjs')
);

if (isDirectExecution) {
  startServer();
}
