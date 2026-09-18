import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'playground_db.json');

const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;

// Ensure data directory exists for local fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Local Database Schema structure
function loadLocalDb() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initialDb = {
      users: [],
      architectures: [],
      revisions: [],
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
  } catch (err) {
    console.error('[DB] Failed to read local db, initializing empty:', err);
    return { users: [], architectures: [], revisions: [] };
  }
}

function saveLocalDb(data) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function initPostgres() {
  if (DATABASE_URL) {
    console.log('[PostgreSQL] Connecting to external PostgreSQL instance via DATABASE_URL...');
    try {
      pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      });

      // Test connection
      await pool.query('SELECT NOW()');

      // Create relational tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS architectures (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          nodes_json TEXT NOT NULL,
          edges_json TEXT NOT NULL,
          chaos_json TEXT,
          grade VARCHAR(8),
          monthly_cost NUMERIC(12, 2) DEFAULT 0,
          is_public BOOLEAN DEFAULT true,
          version INT DEFAULT 1,
          fork_of_id VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS architecture_revisions (
          id VARCHAR(64) PRIMARY KEY,
          architecture_id VARCHAR(64) REFERENCES architectures(id) ON DELETE CASCADE,
          version INT NOT NULL,
          nodes_json TEXT NOT NULL,
          edges_json TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('[PostgreSQL] Schema initialized successfully on PostgreSQL.');
      return;
    } catch (err) {
      console.warn('[PostgreSQL] Could not connect to DATABASE_URL, falling back to embedded SQL store:', err.message);
      pool = null;
    }
  }

  // Fallback local persistence
  console.log(`[DB] Operating in Zero-Config Embedded Relational Mode (${LOCAL_DB_PATH})`);
  loadLocalDb();
}

// User CRUD Operations
export async function createUser({ email, passwordHash, name }) {
  const id = `usr_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  if (pool) {
    const res = await pool.query(
      'INSERT INTO users (id, email, password_hash, name, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, created_at',
      [id, email, passwordHash, name, now]
    );
    return res.rows[0];
  } else {
    const db = loadLocalDb();
    const newUser = { id, email, password_hash: passwordHash, name, created_at: now };
    db.users.push(newUser);
    saveLocalDb(db);
    return { id, email, name, created_at: now };
  }
}

export async function findUserByEmail(email) {
  if (pool) {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  } else {
    const db = loadLocalDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

export async function findUserById(id) {
  if (pool) {
    const res = await pool.query('SELECT id, email, name, created_at FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  } else {
    const db = loadLocalDb();
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
}

// Architecture CRUD Operations
export async function saveArchitecture({
  userId,
  name,
  description = '',
  nodes,
  edges,
  chaos = {},
  grade = 'A',
  monthlyCost = 0,
  isPublic = true,
}) {
  const id = `arch_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  const nodesJson = JSON.stringify(nodes);
  const edgesJson = JSON.stringify(edges);
  const chaosJson = JSON.stringify(chaos);

  if (pool) {
    const res = await pool.query(
      `INSERT INTO architectures 
       (id, user_id, name, description, nodes_json, edges_json, chaos_json, grade, monthly_cost, is_public, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, $11, $12)
       RETURNING *`,
      [id, userId, name, description, nodesJson, edgesJson, chaosJson, grade, monthlyCost, isPublic, now, now]
    );

    await pool.query(
      `INSERT INTO architecture_revisions (id, architecture_id, version, nodes_json, edges_json, created_at)
       VALUES ($1, $2, 1, $3, $4, $5)`,
      [`rev_${crypto.randomBytes(8).toString('hex')}`, id, nodesJson, edgesJson, now]
    );

    return formatArchitecture(res.rows[0]);
  } else {
    const db = loadLocalDb();
    const newArch = {
      id,
      user_id: userId,
      name,
      description,
      nodes_json: nodesJson,
      edges_json: edgesJson,
      chaos_json: chaosJson,
      grade,
      monthly_cost: monthlyCost,
      is_public: isPublic,
      version: 1,
      fork_of_id: null,
      created_at: now,
      updated_at: now,
    };
    db.architectures.unshift(newArch);
    db.revisions.push({
      id: `rev_${crypto.randomBytes(8).toString('hex')}`,
      architecture_id: id,
      version: 1,
      nodes_json: nodesJson,
      edges_json: edgesJson,
      created_at: now,
    });
    saveLocalDb(db);
    return formatArchitecture(newArch);
  }
}

export async function listArchitectures({ userId = null, publicOnly = false } = {}) {
  if (pool) {
    let query = 'SELECT a.*, u.name as author_name FROM architectures a LEFT JOIN users u ON a.user_id = u.id';
    const params = [];
    if (publicOnly) {
      query += ' WHERE a.is_public = true';
    } else if (userId) {
      query += ' WHERE a.user_id = $1 OR a.is_public = true';
      params.push(userId);
    }
    query += ' ORDER BY a.updated_at DESC LIMIT 50';

    const res = await pool.query(query, params);
    return res.rows.map(formatArchitecture);
  } else {
    const db = loadLocalDb();
    let list = db.architectures;
    if (publicOnly) {
      list = list.filter((a) => a.is_public);
    } else if (userId) {
      list = list.filter((a) => a.user_id === userId || a.is_public);
    }
    return list.map((a) => {
      const author = db.users.find((u) => u.id === a.user_id);
      return {
        ...formatArchitecture(a),
        author_name: author ? author.name : 'Anonymous Engineer',
      };
    });
  }
}

export async function getArchitectureById(id) {
  if (pool) {
    const res = await pool.query(
      'SELECT a.*, u.name as author_name FROM architectures a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = $1',
      [id]
    );
    return res.rows[0] ? formatArchitecture(res.rows[0]) : null;
  } else {
    const db = loadLocalDb();
    const arch = db.architectures.find((a) => a.id === id);
    if (!arch) return null;
    const author = db.users.find((u) => u.id === arch.user_id);
    return {
      ...formatArchitecture(arch),
      author_name: author ? author.name : 'Anonymous Engineer',
    };
  }
}

export async function updateArchitecture(id, userId, updates) {
  const now = new Date().toISOString();
  if (pool) {
    const current = await pool.query('SELECT * FROM architectures WHERE id = $1', [id]);
    if (!current.rows[0]) return null;

    const nextVersion = (current.rows[0].version || 1) + 1;
    const nodesJson = updates.nodes ? JSON.stringify(updates.nodes) : current.rows[0].nodes_json;
    const edgesJson = updates.edges ? JSON.stringify(updates.edges) : current.rows[0].edges_json;
    const chaosJson = updates.chaos ? JSON.stringify(updates.chaos) : current.rows[0].chaos_json;

    const res = await pool.query(
      `UPDATE architectures SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        nodes_json = $3,
        edges_json = $4,
        chaos_json = $5,
        grade = COALESCE($6, grade),
        monthly_cost = COALESCE($7, monthly_cost),
        is_public = COALESCE($8, is_public),
        version = $9,
        updated_at = $10
       WHERE id = $11 RETURNING *`,
      [
        updates.name || null,
        updates.description || null,
        nodesJson,
        edgesJson,
        chaosJson,
        updates.grade || null,
        updates.monthlyCost !== undefined ? updates.monthlyCost : null,
        updates.isPublic !== undefined ? updates.isPublic : null,
        nextVersion,
        now,
        id,
      ]
    );

    await pool.query(
      `INSERT INTO architecture_revisions (id, architecture_id, version, nodes_json, edges_json, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`rev_${crypto.randomBytes(8).toString('hex')}`, id, nextVersion, nodesJson, edgesJson, now]
    );

    return formatArchitecture(res.rows[0]);
  } else {
    const db = loadLocalDb();
    const idx = db.architectures.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const current = db.architectures[idx];
    const nextVersion = (current.version || 1) + 1;
    const nodesJson = updates.nodes ? JSON.stringify(updates.nodes) : current.nodes_json;
    const edgesJson = updates.edges ? JSON.stringify(updates.edges) : current.edges_json;
    const chaosJson = updates.chaos ? JSON.stringify(updates.chaos) : current.chaos_json;

    const updated = {
      ...current,
      name: updates.name !== undefined ? updates.name : current.name,
      description: updates.description !== undefined ? updates.description : current.description,
      nodes_json: nodesJson,
      edges_json: edgesJson,
      chaos_json: chaosJson,
      grade: updates.grade !== undefined ? updates.grade : current.grade,
      monthly_cost: updates.monthlyCost !== undefined ? updates.monthlyCost : current.monthly_cost,
      is_public: updates.isPublic !== undefined ? updates.isPublic : current.is_public,
      version: nextVersion,
      updated_at: now,
    };

    db.architectures[idx] = updated;
    db.revisions.push({
      id: `rev_${crypto.randomBytes(8).toString('hex')}`,
      architecture_id: id,
      version: nextVersion,
      nodes_json: nodesJson,
      edges_json: edgesJson,
      created_at: now,
    });
    saveLocalDb(db);
    return formatArchitecture(updated);
  }
}

export async function deleteArchitecture(id, userId) {
  if (pool) {
    const res = await pool.query('DELETE FROM architectures WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  } else {
    const db = loadLocalDb();
    const initialLen = db.architectures.length;
    db.architectures = db.architectures.filter((a) => a.id !== id);
    db.revisions = db.revisions.filter((r) => r.architecture_id !== id);
    saveLocalDb(db);
    return db.architectures.length < initialLen;
  }
}

export async function forkArchitecture(sourceId, userId, newName) {
  const source = await getArchitectureById(sourceId);
  if (!source) return null;

  const forked = await saveArchitecture({
    userId,
    name: newName || `${source.name} (Fork)`,
    description: `Forked from ${source.name}. ${source.description || ''}`,
    nodes: source.nodes,
    edges: source.edges,
    chaos: source.chaos,
    grade: source.grade,
    monthlyCost: source.monthlyCost,
    isPublic: true,
  });

  return forked;
}

function formatArchitecture(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    nodes: JSON.parse(row.nodes_json || '[]'),
    edges: JSON.parse(row.edges_json || '[]'),
    chaos: JSON.parse(row.chaos_json || '{}'),
    grade: row.grade || 'A',
    monthlyCost: Number(row.monthly_cost || 0),
    isPublic: Boolean(row.is_public),
    version: Number(row.version || 1),
    forkOfId: row.fork_of_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author_name || 'Cloud Architect',
  };
}
