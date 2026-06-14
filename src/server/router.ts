import { listSessions, getSession } from '../db/sessions.ts';
import { getSessionEvents } from '../db/lens.ts';
import { getLensDb } from '../db/client.ts';
import { listJobs } from '../scheduler/scheduler.ts';
import { retrieve, writeEpisodic } from '../memory/store.ts';
import { loadConfig } from '../config/config.ts';
import { buildEmbedder } from '../memory/embeddings.ts';
import { listSkills } from '../memory/skills.ts';
import { listPolicies } from '../security/policy.ts';
import { getMemoryDb } from '../db/client.ts';
import { pingProcess, VALIDATOR_SOCK, EXECUTOR_SOCK, SCHEDULER_SOCK } from '../ipc/transport.ts';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function notFound(msg = 'Not found'): Response {
  return json({ error: msg }, 404);
}

function err(msg: string, status = 500): Response {
  return json({ error: msg }, status);
}

export async function handleApi(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // GET /api/sessions
  if (req.method === 'GET' && path === '/api/sessions') {
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const sessions = await listSessions(limit);
    return json(sessions);
  }

  // GET /api/sessions/:id
  const sessionMatch = path.match(/^\/api\/sessions\/([^/]+)$/);
  if (req.method === 'GET' && sessionMatch) {
    const session = await getSession(sessionMatch[1]);
    if (!session) return notFound('Session not found');
    return json(session);
  }

  // GET /api/sessions/:id/events
  const eventsMatch = path.match(/^\/api\/sessions\/([^/]+)\/events$/);
  if (req.method === 'GET' && eventsMatch) {
    const events = await getSessionEvents(eventsMatch[1]);
    return json(events);
  }

  // GET /api/jobs
  if (req.method === 'GET' && path === '/api/jobs') {
    const status = url.searchParams.get('status') as never ?? undefined;
    const jobs = await listJobs(status);
    return json(jobs);
  }

  // GET /api/memory/search?q=...
  if (req.method === 'GET' && path === '/api/memory/search') {
    const q = url.searchParams.get('q');
    if (!q) return err('Missing query param: q', 400);
    const config = await loadConfig();
    const embedder = buildEmbedder(config);
    const hits = await retrieve(q, embedder, { limit: 10 });
    return json(hits);
  }

  // GET /api/health
  if (req.method === 'GET' && path === '/api/health') {
    return json({ status: 'ok', ts: new Date().toISOString() });
  }

  // GET /api/status — daemon health
  if (req.method === 'GET' && path === '/api/status') {
    const [validator, executor, scheduler] = await Promise.all([
      pingProcess(VALIDATOR_SOCK),
      pingProcess(EXECUTOR_SOCK),
      pingProcess(SCHEDULER_SOCK),
    ]);
    const config = await loadConfig();
    return json({
      provider: config.defaultProvider,
      model: config.providers[config.defaultProvider]?.model ?? 'unknown',
      daemons: { validator, executor, scheduler },
      ts: new Date().toISOString(),
    });
  }

  // GET /api/lens/recent?limit=50
  if (req.method === 'GET' && path === '/api/lens/recent') {
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const db = await getLensDb();
    const events = await db.all(
      `SELECT * FROM lens_events ORDER BY started_at DESC LIMIT ?`,
      [limit],
    );
    return json(events);
  }

  // GET /api/sessions/:id/messages
  const msgsMatch = path.match(/^\/api\/sessions\/([^/]+)\/messages$/);
  if (req.method === 'GET' && msgsMatch) {
    const session = await getSession(msgsMatch[1]);
    if (!session) return notFound('Session not found');
    const db = await getLensDb();
    const msgs = await db.all(
      `SELECT * FROM lens_events WHERE session_id = ? AND event_type IN ('user_message','agent_response') ORDER BY started_at ASC`,
      [msgsMatch[1]],
    );
    return json(msgs);
  }

  // POST /api/memory/add
  if (req.method === 'POST' && path === '/api/memory/add') {
    const body = await req.json() as { content: string; type?: string; topics?: string[] };
    if (!body.content?.trim()) return err('Missing content', 400);
    await writeEpisodic({ summary: body.content, sessionId: 'web_manual', topics: body.topics });
    return json({ ok: true });
  }

  // GET /api/skills
  if (req.method === 'GET' && path === '/api/skills') {
    const skills = await listSkills(50);
    return json(skills);
  }

  // GET /api/policies
  if (req.method === 'GET' && path === '/api/policies') {
    const policies = await listPolicies();
    return json(policies);
  }

  // GET /api/memory/stats
  if (req.method === 'GET' && path === '/api/memory/stats') {
    const db = await getMemoryDb();
    const [ep, sem, ref, proc] = await Promise.all([
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM episodic_memory`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM semantic_memory`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM reflection_memory`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM procedural_memory`),
    ]);
    return json({ episodic: ep?.count ?? 0, semantic: sem?.count ?? 0, reflection: ref?.count ?? 0, procedural: proc?.count ?? 0 });
  }

  return null;
}
