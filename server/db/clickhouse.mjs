import { createClient } from '@clickhouse/client';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL;
let clickhouseClient = null;

// Fallback in-memory columnar telemetry buffer
// Circular buffer keeping the last 100,000 simulation ticks
const MAX_LOCAL_TICKS = 100000;
const localTelemetryBuffer = [];

export async function initClickHouse() {
  if (CLICKHOUSE_URL) {
    console.log(`[ClickHouse] Connecting to ClickHouse instance at ${CLICKHOUSE_URL}...`);
    try {
      clickhouseClient = createClient({
        url: CLICKHOUSE_URL,
        username: process.env.CLICKHOUSE_USER || 'default',
        password: process.env.CLICKHOUSE_PASSWORD || '',
        database: process.env.CLICKHOUSE_DATABASE || 'default',
      });

      await clickhouseClient.ping();

      // Create columnar MergeTree table
      await clickhouseClient.command({
        query: `
          CREATE TABLE IF NOT EXISTS system_design_telemetry (
            timestamp DateTime64(3, 'UTC'),
            architecture_id LowCardinality(String),
            session_id String,
            rps Float32,
            p95_latency_ms Float32,
            queue_depth UInt32,
            error_rate Float32,
            bottleneck_node LowCardinality(String),
            engine_mode LowCardinality(String)
          ) ENGINE = MergeTree()
          ORDER BY (architecture_id, timestamp);
        `,
      });

      console.log('[ClickHouse] Columnar telemetry table initialized successfully.');
      return;
    } catch (err) {
      console.warn('[ClickHouse] Connection to ClickHouse failed, falling back to embedded columnar buffer:', err.message);
      clickhouseClient = null;
    }
  }

  console.log('[ClickHouse] Operating in Embedded Columnar In-Memory Telemetry Mode');
}

export async function ingestTelemetryBatch(ticks) {
  if (!Array.isArray(ticks) || ticks.length === 0) return { inserted: 0 };

  const sanitized = ticks.map((t) => ({
    timestamp: t.timestamp || Date.now(),
    architecture_id: t.architectureId || 'default',
    session_id: t.sessionId || 'anonymous',
    rps: Number(t.rps || 0),
    p95_latency_ms: Number(t.p95LatencyMs || 0),
    queue_depth: Math.round(Number(t.queueDepth || 0)),
    error_rate: Number(t.errorRate || 0),
    bottleneck_node: String(t.bottleneckNode || 'none'),
    engine_mode: String(t.engineMode || 'wasm'),
  }));

  if (clickhouseClient) {
    try {
      await clickhouseClient.insert({
        table: 'system_design_telemetry',
        values: sanitized.map((s) => ({
          ...s,
          timestamp: new Date(s.timestamp).toISOString(),
        })),
        format: 'JSONEachRow',
      });
      return { inserted: sanitized.length };
    } catch (err) {
      console.error('[ClickHouse] Batch insert error:', err);
    }
  }

  // Local Buffer Ingestion
  for (const record of sanitized) {
    if (localTelemetryBuffer.length >= MAX_LOCAL_TICKS) {
      localTelemetryBuffer.shift(); // Evict oldest
    }
    localTelemetryBuffer.push(record);
  }

  return { inserted: sanitized.length };
}

export async function queryTelemetryAnalytics({ architectureId = null, timeWindowMinutes = 60 } = {}) {
  const cutoffTime = Date.now() - timeWindowMinutes * 60 * 1000;

  if (clickhouseClient) {
    try {
      const archFilter = architectureId ? `AND architecture_id = '${architectureId}'` : '';
      const query = `
        SELECT
          count() as total_ticks,
          avg(rps) as avg_rps,
          max(rps) as max_rps,
          avg(queue_depth) as avg_queue,
          max(queue_depth) as max_queue,
          avg(error_rate) as avg_error_rate,
          quantile(0.50)(p95_latency_ms) as p50_latency,
          quantile(0.90)(p95_latency_ms) as p90_latency,
          quantile(0.95)(p95_latency_ms) as p95_latency,
          quantile(0.99)(p95_latency_ms) as p99_latency
        FROM system_design_telemetry
        WHERE timestamp >= toDateTime64(${cutoffTime / 1000}, 3, 'UTC') ${archFilter}
      `;

      const resultSet = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });
      const rows = await resultSet.json();
      const stats = rows[0] || {};

      return {
        totalTicks: Number(stats.total_ticks || 0),
        avgRps: Math.round(Number(stats.avg_rps || 0)),
        maxRps: Math.round(Number(stats.max_rps || 0)),
        avgQueue: Math.round(Number(stats.avg_queue || 0)),
        maxQueue: Math.round(Number(stats.max_queue || 0)),
        avgErrorRate: Number(stats.avg_error_rate || 0),
        p50LatencyMs: Number((stats.p50_latency || 0).toFixed(1)),
        p90LatencyMs: Number((stats.p90_latency || 0).toFixed(1)),
        p95LatencyMs: Number((stats.p95_latency || 0).toFixed(1)),
        p99LatencyMs: Number((stats.p99_latency || 0).toFixed(1)),
        source: 'clickhouse-native',
      };
    } catch (err) {
      console.warn('[ClickHouse] Query error, falling back to local buffer analytics:', err.message);
    }
  }

  // Local Buffer Analytics Aggregator
  let matches = localTelemetryBuffer.filter((t) => t.timestamp >= cutoffTime);
  if (architectureId) {
    matches = matches.filter((t) => t.architecture_id === architectureId);
  }

  if (matches.length === 0) {
    return {
      totalTicks: 0,
      avgRps: 0,
      maxRps: 0,
      avgQueue: 0,
      maxQueue: 0,
      avgErrorRate: 0,
      p50LatencyMs: 0,
      p90LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      source: 'embedded-columnar',
    };
  }

  const latencies = matches.map((m) => m.p95_latency_ms).sort((a, b) => a - b);
  const rpsValues = matches.map((m) => m.rps);
  const queues = matches.map((m) => m.queue_depth);
  const errors = matches.map((m) => m.error_rate);

  const getPercentile = (arr, p) => {
    const idx = Math.min(arr.length - 1, Math.floor(arr.length * p));
    return Number(arr[idx].toFixed(1));
  };

  const sumRps = rpsValues.reduce((a, b) => a + b, 0);
  const maxRps = Math.max(...rpsValues);
  const sumQueue = queues.reduce((a, b) => a + b, 0);
  const maxQueue = Math.max(...queues);
  const sumError = errors.reduce((a, b) => a + b, 0);

  // Time-series bucketing (e.g. 20 buckets across the window)
  const bucketCount = 20;
  const bucketDuration = (Date.now() - cutoffTime) / bucketCount;
  const timeSeries = [];

  for (let i = 0; i < bucketCount; i++) {
    const bStart = cutoffTime + i * bucketDuration;
    const bEnd = bStart + bucketDuration;
    const bMatches = matches.filter((m) => m.timestamp >= bStart && m.timestamp < bEnd);
    if (bMatches.length > 0) {
      const bAvgRps = Math.round(bMatches.reduce((acc, m) => acc + m.rps, 0) / bMatches.length);
      const bAvgLat = Number((bMatches.reduce((acc, m) => acc + m.p95_latency_ms, 0) / bMatches.length).toFixed(1));
      timeSeries.push({
        time: new Date(bStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        rps: bAvgRps,
        latencyMs: bAvgLat,
        ticks: bMatches.length,
      });
    }
  }

  return {
    totalTicks: matches.length,
    avgRps: Math.round(sumRps / matches.length),
    maxRps: Math.round(maxRps),
    avgQueue: Math.round(sumQueue / matches.length),
    maxQueue: Math.round(maxQueue),
    avgErrorRate: Number((sumError / matches.length).toFixed(2)),
    p50LatencyMs: getPercentile(latencies, 0.5),
    p90LatencyMs: getPercentile(latencies, 0.9),
    p95LatencyMs: getPercentile(latencies, 0.95),
    p99LatencyMs: getPercentile(latencies, 0.99),
    timeSeries,
    source: 'embedded-columnar',
  };
}
