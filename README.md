# CortexPrism

> An open-source agentic harness system. Hosts, orchestrates, and empowers AI agents with memory, tools, sandboxed code execution, a web UI, reflection, model routing, and layered security.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deno 2.x](https://img.shields.io/badge/runtime-Deno%202.x-black)](https://deno.land)

---

## Features

- **Interactive chat** — streaming CLI chat with 12 LLM providers: Anthropic, OpenAI, Google Gemini, Mistral, Groq, DeepSeek, OpenRouter, xAI, Together AI, AWS Bedrock, Cohere, Ollama
- **Tool use** — file read, shell execution, web search, code execution — all with approval gates
- **Coding sandbox** — ephemeral Docker containers (or subprocess fallback) with resource limits; LLM auto-fix loop
- **5-tier memory** — episodic (FTS5 keyword), semantic (vector embeddings), reflection (learned patterns); multi-strategy retrieval with decay scoring
- **Model router** — RouteLLM cascading: tries cheapest model first, escalates on low confidence
- **Web UI + REST API** — built-in HTTP server with WebSocket streaming, Lens timeline, memory search, and jobs dashboard
- **Per-turn reflection** — LLM self-assessment of confidence/quality; meta-pattern consolidation
- **Scheduled jobs** — SQLite-persisted cron with retry
- **Security (Parallax model)** — every tool call gated through a policy validator; AES-256-GCM credential vault; regex allow/deny rules
- **Cortex Lens** — full activity audit log of all sessions, tool calls, and policy decisions

---

## Requirements

- [Deno 2.x](https://deno.land)
- Docker (optional, for sandbox isolation — subprocess fallback available)

---

## Quick Start

```bash
# Clone
git clone https://github.com/your-org/cortex
cd cortex

# First run — initialises all databases and launches the setup wizard
deno task chat
```

On first run, Cortex will prompt you to choose an LLM provider and enter credentials. Config is saved to `~/.cortex/config.json`.

---

## CLI Reference

```
cortex <command>

Commands:
  chat              Interactive streaming chat session
  setup             Re-run the setup wizard
  sessions          List recent chat sessions
  run <file>        Execute a code file in the sandbox
  serve             Start the HTTP + WebSocket server with Web UI
  daemon            Manage background processes (validator, executor, scheduler)
  stop              Stop all background processes (server + daemons)
  memory            Search and manage memory
  reflect           Inspect and consolidate reflection patterns
  jobs              Manage scheduled jobs
  vault             Encrypted credential vault (store / get / list / delete)
  policy            Security policy rules (list / add / remove / check)
  migrate           Initialise or migrate all databases
```

### `cortex chat`

```bash
cortex chat                          # Start a chat session
cortex chat --model gpt-4o           # Override model
cortex chat --no-stream              # Disable streaming output
```

Slash commands inside chat:
```
/exit   Quit
/help   Show available commands
/clear  Clear the screen
```

### `cortex run <file>`

```bash
cortex run script.py                 # Run in Docker sandbox (auto-detect language)
cortex run script.py --no-sandbox    # Run as direct subprocess
cortex run script.py --fix           # Enable LLM auto-fix loop on failure
cortex run script.py --fix --max-fix 6  # Up to 6 fix attempts
```

Supported languages: `python`, `javascript`, `typescript`, `bash`, `ruby`, `go`, `rust`

### `cortex daemon`

```bash
cortex daemon start                  # Start supervisor + all daemons in background (auto-restart on crash)
cortex daemon stop                   # Stop all daemon processes
cortex daemon restart                # Restart all daemon processes (stop + 1s delay + start)
cortex daemon run                    # Run supervisor in foreground (for systemd / tmux)
cortex daemon status                 # Show running/stopped for each daemon process
```

Three daemon processes are managed:
- **Validator** — approves/rejects tool intents via security policy
- **Executor** — executes approved tool calls (file ops, shell commands)
- **Scheduler** — runs cron jobs and periodic memory consolidation

The supervisor auto-restarts any crashed daemon with exponential backoff.

### `cortex serve`

```bash
cortex serve                         # http://127.0.0.1:3000 (foreground)
cortex serve --port 8080 --host 0.0.0.0
cortex serve -d                      # Run in the background (daemon mode)
cortex serve -d -r                   # Restart background server on the same port
cortex serve -s                      # Stop background server
cortex stop                          # Stop server + daemons
cortex stop --server-only            # Stop only the HTTP server
cortex stop --daemon-only            # Stop only the daemon processes
```

Web UI tabs: **Chat** (WebSocket streaming), **Lens** (activity timeline), **Memory** (search), **Jobs** (status)

REST API endpoints:
```
GET  /api/health
GET  /api/sessions?limit=20
GET  /api/sessions/:id
GET  /api/sessions/:id/events
GET  /api/jobs?status=pending
GET  /api/memory/search?q=<query>
WS   /ws   (streaming chat)
```

### `cortex memory`

```bash
cortex memory search "sqlite"        # Keyword + vector search
cortex memory search "sqlite" --semantic  # Vector only
cortex memory add "CortexPrism uses SQLite WAL mode"  # Add semantic fact
```

### `cortex reflect`

```bash
cortex reflect list                  # Show stored reflection patterns
cortex reflect consolidate           # Run LLM meta-pattern extraction
```

### `cortex vault`

```bash
export CORTEX_VAULT_KEY="your-passphrase"

cortex vault store "openai-key" --service openai  # Prompts for value
cortex vault get "openai-key"
cortex vault list
cortex vault delete "openai-key"
```

Vault uses **AES-256-GCM** encryption with **PBKDF2** key derivation (100k iterations, SHA-256). The passphrase is never stored — only held in the environment variable at runtime.

### `cortex policy`

```bash
cortex policy list
cortex policy add "curl.*evil\.com" --kind shell --effect deny --reason "Blocked domain"
cortex policy check shell "rm -rf /etc"
cortex policy remove pol_abc123
```

Default deny rules (seeded on first migrate):
- `rm\s+-rf\s+/` — recursive root delete
- `:\(\)\{.*\}` — fork bomb patterns
- `dd\s+if=.*of=/dev/` — direct disk writes
- `chmod\s+777\s+/` — world-write on root

---

## Configuration

Config file: `~/.cortex/config.json`

```json
{
  "version": 1,
  "defaultProvider": "anthropic",
  "providers": {
    "anthropic":  { "kind": "anthropic",  "model": "claude-sonnet-4-5",       "apiKey": "sk-..." },
    "openai":     { "kind": "openai",     "model": "gpt-4o",                  "apiKey": "sk-..." },
    "google":     { "kind": "google",     "model": "gemini-2.0-flash",        "apiKey": "..." },
    "mistral":    { "kind": "mistral",    "model": "mistral-large-latest",    "apiKey": "..." },
    "groq":       { "kind": "groq",       "model": "llama-3.3-70b-versatile", "apiKey": "gsk_..." },
    "deepseek":   { "kind": "deepseek",   "model": "deepseek-chat",           "apiKey": "sk-..." },
    "openrouter": { "kind": "openrouter", "model": "openai/gpt-4o",           "apiKey": "..." },
    "xai":        { "kind": "xai",        "model": "grok-2-latest",           "apiKey": "..." },
    "together":   { "kind": "together",   "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo", "apiKey": "..." },
    "bedrock":    { "kind": "bedrock",    "model": "anthropic.claude-3-5-sonnet-20240620-v1:0", "apiKey": "AKIA...", "secretKey": "...", "baseUrl": "us-east-1" },
    "cohere":     { "kind": "cohere",     "model": "command-r-plus",          "apiKey": "..." },
    "ollama":     { "kind": "ollama",     "model": "llama3.2",                "baseUrl": "http://localhost:11434" }
  },
  "agent": {
    "name": "Cortex",
    "maxTurns": 50,
    "streamOutput": true
  },
  "router": {
    "enabled": false,
    "confidenceThreshold": 0.7,
    "cascade": [
      { "provider": "ollama",    "model": "llama3.2:3b" },
      { "provider": "ollama",    "model": "llama3.1:8b" },
      { "provider": "anthropic", "model": "claude-haiku-4-5" }
    ]
  }
}
```

### Data Directory

Default: `~/.cortex/data/`

Override:
```bash
CORTEX_DATA_DIR=/data/cortex cortex chat
```

### Databases

| File | Contents |
|---|---|
| `cortex.db` | Core: sessions, jobs, policy rules |
| `memory.db` | 5-tier memory: episodic, semantic, reflection |
| `lens.db` | Audit log: all events, tool calls, policy checks |
| `vault.db` | Encrypted credentials |
| `plugins.db` | Plugin registry (future) |
| `sess_*.db` | Per-session ephemeral message history |

---

## Architecture

```
cortex chat / cortex serve
       │
       ▼
  agent/loop.ts          ← core reasoning + tool loop
       │
       ├── memory/        ← inject context, write episodic entries
       │   ├── store.ts   ← FTS5 keyword + cosine vector retrieval
       │   └── inject.ts  ← prepend memory hits to system prompt
       │
       ├── agent/reflect.ts  ← post-turn self-assessment
       │
       ├── tools/executor.ts ← parse tool calls, validate, execute
       │   └── security/validator.ts  ← Parallax policy gate
       │
        ├── llm/router.ts     ← CascadeRouter (optional)
        │   └── anthropic / openai / google / mistral / groq / deepseek /
        │       openrouter / xai / together / bedrock / cohere / ollama
       │
       └── sandbox/executor.ts  ← Docker / subprocess code execution
           └── sandbox/autofix.ts  ← LLM fix loop
```

### Parallax Security Model

Every tool call passes through a 3-stage validator before execution:

```
Agent emits <tool_call>
  → policy check: is this tool allowed?
  → policy check: is the shell command safe? (pattern match)
  → policy check: is the domain allowed? (for web_search)
  → DENY → error returned to agent (no execution)
  → ALLOW → tool.execute() runs
  → Lens: policy_check + tool_call events logged
```

### Memory Retrieval

```
Query
  → FTS5 keyword search (episodic + semantic)
  → cosine vector similarity (embedding model)
  → merge + re-score: score × 2^(-age_days / half_life_days)
  → top-K injected into system prompt
```

---

## Development

```bash
deno task dev       # Run with --allow-all
deno task check     # Type-check (zero errors expected)
deno task lint      # Lint
deno task fmt       # Format
deno task serve     # Start HTTP server on :3000
deno task test      # Run tests
```

### Project Structure

```
src/
├── main.ts                      CLI entrypoint — all command registrations
├── agent/
│   ├── loop.ts                  Core agent turn loop (tool rounds, memory, reflection)
│   ├── reflect.ts               Per-turn reflection + consolidation
│   └── soul.ts                  Agent persona + system prompt builder
├── cli/
│   ├── chat.ts                  cortex chat
│   ├── daemon.ts                cortex daemon (start/run/status/stop) + ensureDaemons()
│   ├── jobs.ts                  cortex jobs
│   ├── memory-cmd.ts            cortex memory
│   ├── migrate.ts               cortex migrate
│   ├── policy-cmd.ts            cortex policy
│   ├── reflect.ts               cortex reflect
│   ├── run.ts                   cortex run
│   ├── serve.ts                 cortex serve (with --daemon flag)
│   ├── service-cmd.ts           cortex service
│   ├── sessions.ts              cortex sessions
│   ├── setup.ts                 First-run setup wizard
│   ├── setup-cmd.ts             cortex setup
│   └── vault-cmd.ts             cortex vault
├── config/
│   ├── config.ts                CortexConfig interface + load/save
│   └── paths.ts                 XDG-style data paths
├── db/
│   ├── client.ts                libsql Db wrapper
│   ├── lens.ts                  Cortex Lens audit log
│   ├── migrate.ts               Migration runner
│   ├── sessions.ts              Session persistence
│   └── migrations/
│       ├── 001_core.sql         Core schema (sessions, jobs, turns)
│       ├── 002_memory.sql       5-tier memory schema + FTS5
│       ├── 003_lens.sql         Lens audit events
│       ├── 004_vault.sql        Credential vault + access log
│       ├── 005_plugins.sql      Plugin registry
│       ├── 006_session.sql      Per-session message store
│       ├── 007_jobs_v2.sql      Jobs scheduler columns
│       ├── 008_memory_embeddings.sql  Embedding + decay columns
│       └── 009_policy.sql       Policy rules + default deny seeds
├── llm/
│   ├── types.ts                 LLMProvider interface
│   ├── anthropic.ts             Anthropic Claude provider
│   ├── openai.ts                OpenAI provider
│   ├── openai-compatible.ts     Reusable base for OpenAI-compatible providers
│   ├── google.ts                Google Gemini provider
│   ├── mistral.ts               Mistral AI provider
│   ├── groq.ts                  Groq provider
│   ├── deepseek.ts              DeepSeek provider
│   ├── openrouter.ts            OpenRouter provider
│   ├── xai.ts                   xAI (Grok) provider
│   ├── together.ts              Together AI provider
│   ├── bedrock.ts               AWS Bedrock provider
│   ├── cohere.ts                Cohere provider
│   ├── ollama.ts                Ollama local provider
│   └── router.ts                buildProvider + CascadeRouter
├── memory/
│   ├── embeddings.ts            EmbeddingProvider (Ollama / OpenAI / Stub)
│   ├── inject.ts                Inject memory hits into system prompt
│   └── store.ts                 Write / search episodic + semantic memory
├── sandbox/
│   ├── executor.ts              Docker / subprocess sandbox runner
│   └── autofix.ts               LLM auto-fix loop
├── processes/
│   ├── supervisor-process.ts    Daemon supervisor (auto-restart children on crash)
│   ├── validator-process.ts     Tool intent validator daemon
│   ├── executor-process.ts      Tool execution daemon
│   ├── scheduler-process.ts     Cron job scheduler daemon
│   ├── sub-agent-entry.ts       Sub-agent child process entry point
│   └── service-entry.ts         Micro-service child process entry point
├── scheduler/
│   └── scheduler.ts             SQLite-persisted job scheduler
├── security/
│   ├── policy.ts                Policy rule engine (checkPolicy)
│   ├── validator.ts             Parallax tool/shell/domain validator
│   └── vault.ts                 AES-256-GCM credential vault
├── server/
│   ├── router.ts                REST API route handlers
│   ├── server.ts                Deno.serve HTTP + WebSocket dispatcher
│   ├── ui.ts                    Inline single-file Web UI (Tailwind CDN)
│   └── ws.ts                    WebSocket session handler
└── tools/
    ├── executor.ts              Parse tool calls, validate, execute, log
    ├── registry.ts              ToolRegistry (register + get)
    ├── types.ts                 Tool / ToolContext interfaces
    └── builtin/
        ├── code_exec.ts         code_exec tool (sandbox)
        ├── file_read.ts         file_read tool
        ├── shell.ts             shell tool (with approval gate)
        └── web_search.ts        web_search tool (DuckDuckGo)
```

---

## License

MIT — see [LICENSE](LICENSE)
