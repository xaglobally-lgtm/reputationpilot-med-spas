// ================================================================
// APP TEMPLATE - EXPRESS.JS BACKEND
// ================================================================
// Production-grade backend with:
// - Supabase PostgreSQL integration
// - API key validation & rate limiting
// - Error logging & alerts
// - Health checks
// - Security headers (CORS, CSP, etc.)
// ================================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import * as crypto from 'crypto';

dotenv.config({ path: '.env.local' });

// ---- TYPES ----

interface AuthRequest extends Request {
  userId?: string;
  apiKeyId?: string;
  isAdmin?: boolean;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'error';
    responseTime?: number;
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
}

// ---- ENVIRONMENT ----

const PORT = parseInt(process.env.PORT || '3000');
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'app-template';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_ADMIN_KEY = process.env.API_ADMIN_KEY!;
const ADMIN_PIN = process.env.API_ADMIN_PIN || ''; // no PIN set = admin access disabled
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
const ERROR_ALERT_EMAIL = process.env.ERROR_ALERT_EMAIL || 'xaglobally@gmail.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_ADMIN_KEY) {
  console.error('❌ Missing required environment variables. Check .env.local');
  process.exit(1);
}

// ---- LOGGING ----

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const levelMap: Record<string, number> = LogLevel;
const currentLogLevel = levelMap[LOG_LEVEL.toUpperCase()] || levelMap.INFO;

function log(level: string, message: string, data?: any) {
  const levelNum = levelMap[level.toUpperCase()] || levelMap.INFO;
  if (levelNum >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${APP_NAME}] [${level.toUpperCase()}]`;
    console.log(prefix, message, data ? JSON.stringify(data, null, 2) : '');
  }
}

// ---- SUPABASE CLIENT ----

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---- EMAIL SERVICE ----

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'noreply@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

async function sendErrorAlert(error: string, context?: Record<string, any>) {
  try {
    const subject = `[${APP_NAME}] ❌ Error Alert - ${new Date().toISOString()}`;
    const htmlBody = `
      <h2>Error Alert from ${APP_NAME}</h2>
      <p><strong>Error:</strong> ${error}</p>
      ${context ? `<pre>${JSON.stringify(context, null, 2)}</pre>` : ''}
      <hr>
      <p><small>Sent from ${APP_NAME} backend</small></p>
    `;

    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'alerts@example.com',
      to: ERROR_ALERT_EMAIL,
      subject,
      html: htmlBody,
    });
  } catch (err) {
    log('ERROR', 'Failed to send error alert email', err);
  }
}

// ---- MIDDLEWARE ----

const app: Express = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Admin-PIN', 'Authorization'],
}));

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests, please try again later',
  standardHeaders: false,
});
app.use(limiter);

// ---- TELEMETRY (errors, slow responses, browser errors -> Planet of the Apps) ----

const SLOW_MS = Number(process.env.SLOW_RESPONSE_MS) || 3000;
const lastReported = new Map<string, number>();
// true = already reported recently (skip); keeps noisy problems from flooding the database
function throttled(key: string, everyMs: number): boolean {
  const now = Date.now();
  if (now - (lastReported.get(key) || 0) < everyMs) return true;
  if (lastReported.size > 2000) lastReported.clear();
  lastReported.set(key, now);
  return false;
}
function recordError(row: { error_code: string; message: string; stack_trace?: string | null; context?: Record<string, unknown>; severity?: string }) {
  supabase.from('app_errors').insert({
    app: APP_NAME,
    severity: row.severity || 'error',
    error_code: row.error_code,
    message: String(row.message).slice(0, 1000),
    stack_trace: row.stack_trace ? String(row.stack_trace).slice(0, 4000) : null,
    context: row.context || {},
  }).then(null, (dbErr) => log('WARN', 'Failed to log error to database', dbErr));
}

// Slow responses and rejected logins (both throttled)
app.use((req: Request, res: Response, next: NextFunction) => {
  const t0 = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - t0;
    if (ms >= SLOW_MS && req.path !== '/client-errors' && !throttled(`slow:${req.method}:${req.path}`, 10 * 60_000)) {
      recordError({ error_code: 'SLOW_RESPONSE', message: `${req.method} ${req.path} took ${ms} ms`, severity: 'warning', context: { ms, status: res.statusCode } });
    }
    // Hosting start-up probes (HEAD / or GET /) are not login attempts: don't log them.
    if (res.statusCode === 401 && req.method !== 'HEAD' && req.path !== '/' && !throttled('auth401', 60_000)) {
      recordError({ error_code: 'AUTH_FAILED', message: `Rejected ${req.method} ${req.path}: missing or invalid key/token`, severity: 'info', context: { path: req.path } });
    }
  });
  next();
});

// Browser error reports from this app's own website (public, rate-limited, no personal data kept)
const CLIENT_KINDS: Record<string, string> = { js: 'JS_ERROR', promise: 'JS_UNHANDLED_REJECTION', api: 'API_CALL_FAILED', network: 'NETWORK_ERROR' };
const clientErrorLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: false });
app.post('/client-errors', clientErrorLimiter, (req: Request, res: Response) => {
  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  const clip = (v: unknown, n: number) => (v == null || v === '' ? null : String(v).slice(0, n));
  const kind = Object.prototype.hasOwnProperty.call(CLIENT_KINDS, String(b.kind)) ? String(b.kind) : 'js';
  const message = clip(b.message, 500);
  if (!message) return res.status(400).json({ error: 'message required' });
  if (!throttled(`client:${kind}:${message}`, 5000)) {
    recordError({
      error_code: CLIENT_KINDS[kind], message, stack_trace: clip(b.stack, 3000), severity: 'error',
      context: { source: 'browser', page: clip(b.page, 300), api: clip(b.api, 300), status: Number(b.status) || null, userAgent: clip(req.headers['user-agent'], 200) },
    });
  }
  res.status(204).end();
});

// Public front door: answers hosting probes and curious visitors without needing a key.
app.all('/', (_req: Request, res: Response) => {
  res.json({ app: APP_NAME, status: 'ok', health: '/health' });
});

// ---- AUTHENTICATION MIDDLEWARE ----

// Timing-safe string comparison (avoids leaking key contents through response timing).
const safeEqual = (a?: string, b?: string): boolean => {
  if (!a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
// Only a SHA-256 fingerprint of each API key is stored; the key itself is shown once at creation.
const hashKey = (k: string): string => crypto.createHash('sha256').update(k).digest('hex');
const keyCache = new Map<string, { ok: boolean; id?: string; at: number }>();
async function lookupApiKey(key: string): Promise<{ ok: boolean; id?: string }> {
  const h = hashKey(key);
  const cached = keyCache.get(h);
  if (cached && Date.now() - cached.at < 60_000) return cached;
  const { data, error } = await supabase
    .from('xag_api_keys')
    .select('id, expires_at')
    .eq('app', APP_NAME)
    .eq('key_hash', h)
    .eq('active', true)
    .maybeSingle();
  const ok = !error && !!data && (!data.expires_at || new Date(data.expires_at) > new Date());
  const result = { ok, id: data?.id as string | undefined, at: Date.now() };
  keyCache.set(h, result);
  if (ok && data) {
    supabase.from('xag_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
      .then(null, (e) => log('WARN', 'Failed to record key use', e));
  }
  return result;
}

app.use(async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Health check is public
    if (req.path === '/health') return next();

    const apiKey = req.headers['x-api-key'] as string | undefined;
    const authHeader = req.headers['authorization'] as string | undefined;

    // Admin: admin key AND matching PIN (both generated per service by Render)
    if (apiKey && safeEqual(apiKey, API_ADMIN_KEY)) {
      if (ADMIN_PIN && safeEqual(req.headers['x-admin-pin'] as string | undefined, ADMIN_PIN)) {
        req.isAdmin = true;
        return next();
      }
      return res.status(401).json({ error: 'Admin requests need a valid X-Admin-PIN header.' });
    }

    // Customer API key: must exist, be active, unexpired, and belong to this app
    if (apiKey) {
      const r = await lookupApiKey(apiKey);
      if (r.ok) { req.userId = `key:${r.id}`; return next(); }
      return res.status(401).json({ error: 'Invalid, revoked or expired API key.' });
    }

    // Signed-in user: verify the Supabase access token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { data, error } = await supabase.auth.getUser(authHeader.slice(7));
      if (!error && data.user) { req.userId = data.user.id; return next(); }
      return res.status(401).json({ error: 'Invalid or expired sign-in token.' });
    }

    res.status(401).json({ error: 'Unauthorized. Provide X-API-Key or Authorization header.' });
  } catch (err) {
    next(err);
  }
});

// ---- ROUTES ----

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const { data, error } = await supabase
      .from('app_users')
      .select('count()', { count: 'exact', head: true });

    const dbResponseTime = Date.now() - startTime;
    const dbStatus = error ? 'error' : 'connected';

    const healthResult: HealthCheckResult = {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus as any,
        responseTime: dbResponseTime,
      },
      memory: process.memoryUsage() as any,
    };

    res.status(200).json(healthResult);

    // Log to database (async, don't wait)
    supabase.from('app_health_checks').insert({
      app: APP_NAME,
      service: 'backend',
      status: healthResult.status,
      response_time_ms: dbResponseTime,
      metadata: { uptime: process.uptime() },
    }).then(null, (err) => log('WARN', 'Failed to log health check', err));

  } catch (err) {
    log('ERROR', 'Health check failed', err);
    res.status(503).json({
      status: 'down',
      error: String(err),
    });
  }
});

// API test endpoint
app.get('/api/test', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.isAdmin ? 'admin' : (req.userId || 'anonymous');
    
    res.json({
      message: 'API is working',
      user,
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      app: APP_NAME,
    });
  } catch (err) {
    log('ERROR', 'Test endpoint error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Echo endpoint (for debugging)
app.post('/api/echo', async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      received: req.body,
      userId: req.userId,
      isAdmin: req.isAdmin,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log('ERROR', 'Echo endpoint error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- API KEY MANAGEMENT (admin only) ----

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) =>
  req.isAdmin ? next() : res.status(403).json({ error: 'Admin only.' });

// Create a key. The full key is returned ONCE; only its fingerprint is stored.
app.post('/api/admin/keys', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const label = String(req.body?.label ?? '').slice(0, 100) || null;
    const expires_at = req.body?.expires_at ? new Date(req.body.expires_at).toISOString() : null;
    const key = `xag_${crypto.randomBytes(24).toString('base64url')}`;
    const { data, error } = await supabase
      .from('xag_api_keys')
      .insert({ app: APP_NAME, label, key_prefix: key.slice(0, 10), key_hash: hashKey(key), expires_at })
      .select('id, label, key_prefix, created_at, expires_at')
      .single();
    if (error) throw error;
    res.status(201).json({ ...data, key, note: 'Store this key now. It cannot be shown again.' });
  } catch (err) { next(err); }
});

// List keys (never returns the keys themselves)
app.get('/api/admin/keys', requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('xag_api_keys')
      .select('id, label, key_prefix, active, created_at, last_used_at, expires_at')
      .eq('app', APP_NAME)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ keys: data });
  } catch (err) { next(err); }
});

// Revoke a key
app.delete('/api/admin/keys/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('xag_api_keys')
      .update({ active: false })
      .eq('id', req.params.id)
      .eq('app', APP_NAME)
      .select('id');
    if (error) throw error;
    keyCache.clear();
    if (!data || !data.length) return res.status(404).json({ error: 'Key not found.' });
    res.json({ revoked: req.params.id });
  } catch (err) { next(err); }
});

// ---- ERROR HANDLING ----

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const errorId = crypto.randomUUID();
  const message = err.message || 'Internal server error';

  // Client mistakes (malformed JSON, oversized body, ...) are not server failures: answer 4xx, don't raise an alert.
  const clientStatus = Number(err.status || err.statusCode);
  if (clientStatus >= 400 && clientStatus < 500) {
    return res.status(clientStatus).json({ error: err.expose ? message : 'Bad request', errorId });
  }
  
  // Request bodies are deliberately NOT logged: they can contain passwords or personal data.
  log('ERROR', `[${errorId}] Unhandled error`, {
    message,
    stack: err.stack,
    url: req.path,
    method: req.method,
  });

  // Save to database (stamped with this app's name so Planet can attribute it)
  recordError({
    error_code: err.code || 'UNKNOWN',
    message,
    stack_trace: err.stack,
    context: { errorId, path: req.path, method: req.method },
    severity: 'error',
  });

  // Send alert email
  sendErrorAlert(message, {
    errorId,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  }).catch(mailErr => log('WARN', 'Failed to send error alert', mailErr));

  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : message,
    errorId,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
  });
});

// ---- SERVER STARTUP ----

const server = app.listen(PORT, () => {
  log('INFO', `✅ ${APP_NAME} backend listening on port ${PORT}`);
  log('INFO', `Environment: ${NODE_ENV}`);
  log('INFO', `Log level: ${LOG_LEVEL}`);
  log('INFO', `Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('INFO', 'SIGTERM received, shutting down gracefully...');
  server.close(() => {
    log('INFO', 'Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('INFO', 'SIGINT received, shutting down gracefully...');
  server.close(() => {
    log('INFO', 'Server closed');
    process.exit(0);
  });
});

// Unhandled rejection
process.on('unhandledRejection', (reason: any) => {
  log('ERROR', 'Unhandled rejection', reason);
  sendErrorAlert(`Unhandled rejection: ${String(reason)}`);
});

export default app;
