import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  initPostgres, 
  createUser, 
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

const PORT = process.env.API_PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'system-design-playground-jwt-secret-key-2026';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));

// Auth Token Middleware
function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : req.cookies?.token;

  if (!token) {
    // Default to local/demo user
    req.user = { id: 'usr_local_architect', name: 'Cloud Architect', email: 'architect@local' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    req.user = { id: 'usr_local_architect', name: 'Cloud Architect', email: 'architect@local' };
    next();
  }
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
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, passwordHash, name });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('[API] Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await findUserByEmail(email);
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

app.get('/api/auth/me', authenticateUser, async (req, res) => {
  const user = await findUserById(req.user.id);
  res.json({ user: user || req.user });
});

// --- Architecture Routes ---

// List architectures
app.get('/api/architectures', authenticateUser, async (req, res) => {
  try {
    const publicOnly = req.query.publicOnly === 'true';
    const list = await listArchitectures({ userId: req.user.id, publicOnly });
    res.json({ architectures: list });
  } catch (err) {
    console.error('[API] List architectures error:', err);
    res.status(500).json({ error: 'Failed to fetch architectures' });
  }
});

// Save new architecture
app.post('/api/architectures', authenticateUser, async (req, res) => {
  try {
    const { name, description, nodes, edges, chaos, grade, monthlyCost, isPublic } = req.body;
    if (!name || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({ error: 'Name, nodes array, and edges array are required' });
    }

    const saved = await saveArchitecture({
      userId: req.user.id,
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
app.put('/api/architectures/:id', authenticateUser, async (req, res) => {
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
app.delete('/api/architectures/:id', authenticateUser, async (req, res) => {
  try {
    const success = await deleteArchitecture(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Architecture not found' });
    }
    res.json({ success: true, message: 'Architecture deleted successfully' });
  } catch (err) {
    console.error('[API] Delete architecture error:', err);
    res.status(500).json({ error: 'Failed to delete architecture' });
  }
});

// Fork architecture
app.post('/api/architectures/:id/fork', authenticateUser, async (req, res) => {
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
async function startServer() {
  await initPostgres();
  await initClickHouse();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express API] System Design Playground API running on http://localhost:${PORT}`);
  });
}

startServer();
