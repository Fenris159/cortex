# Changelog

All notable changes to CortexPrism are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
Versioning: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

### Changed
- **`src/server/ui.ts`** — improved empty states, API key masking in Settings (shows "✓ set" instead of plaintext), card hover effects, custom scrollbar, `autocomplete="off"` on password fields
- **`src/cli/daemon.ts`** — added `--allow-ffi` to all 3 process permission sets required by libsql native binding

---

---

## [0.9.0] — 2026-06-14 · Gap-closure sprint: Memory, IPC, Security, Channels

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

### Changed
- `src/agent/loop.ts` — runs `assessTask` before memory injection; short-circuits on `ask_first`; applies meta-cog system prompt prefix; calls `extractAndStoreEntities` fire-and-forget after each turn
- `src/cli/chat.ts` — loads `loadSoulContext()` (SOUL + USER + MEMORY) instead of `loadSoul()` alone; `/soul` slash command shows all three files
- `src/cli/jobs.ts` — `run-due` dispatches `cortex:consolidate:*` jobs to consolidation runners instead of shell exec
- `src/main.ts` — registered `daemon`, `soul`, `discord`, `plugins`, `import` commands

---

## [0.8.0] — 2026-06-14 · Sprint 8: Security (Parallax Model)

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

### Changed
- `src/db/lens.ts` — added `tool_call` and `policy_check` to `EventType` union
- `src/main.ts` — registered `vault` and `policy` commands

---

## [0.7.0] — 2026-06-14 · Sprint 7: Reflection + Model Router

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

### Changed
- `src/agent/loop.ts` — added `enableReflection` option; fires `reflectOnTurn` + `storeReflection` post-turn (non-blocking, fire-and-forget)
- `src/cli/chat.ts` — builds `CascadeRouter` from config when `router.enabled`; falls back to direct provider
- `src/main.ts` — registered `reflect` command

---

## [0.6.0] — 2026-06-14 · Sprint 6: Channels (HTTP + WebSocket + Web UI)

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

### Changed
- `src/main.ts` — registered `serve` command

---

## [0.5.0] — 2026-06-14 · Sprint 5: Coding Sandbox

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

### Changed
- `src/cli/chat.ts` — registered `code_exec` tool in chat session registry
- `src/main.ts` — registered `run` command

---

## [0.4.0] — 2026-06-14 · Sprint 4: Memory v1

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

### Changed
- `src/agent/loop.ts` — inject memory into system prompt before LLM call; write episodic entry in `finally` block; accepts `embedder` option
- `src/cli/chat.ts` — builds embedder from config, passes to `agentTurn`
- `src/db/migrate.ts` — added migration 008 applied to `memory.db`
- `src/main.ts` — registered `memory` command

---

## [0.3.0] — 2026-06-14 · Sprint 3: Tools + Scheduling

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

### Changed
- `src/agent/loop.ts` — added agentic tool-call loop (parse → validate → execute → re-prompt, up to `MAX_TOOL_ROUNDS=8`); accepts `registry` and `toolContext` options
- `src/cli/chat.ts` — builds `ToolRegistry`, registers builtins, builds approval gate, passes to `agentTurn`
- `src/db/migrate.ts` — added migration 007 applied to `cortex.db`
- `src/main.ts` — registered `jobs` command

---

## [0.2.0] — 2026-06-14 · Sprint 2: Sessions + Setup

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

### Changed
- `src/cli/chat.ts` — integrated session lifecycle (create on start, close on exit, Lens events)
- `src/main.ts` — registered `sessions` and `setup` commands

---

## [0.1.0] — 2026-06-14 · Sprint 1: Cortex Lite (initial release)

### Added
- **`src/agent/sub-agent.ts`** — Sub-agent spawning system: `spawnSubAgent()` spawns a child Deno process, communicates via stdin/stdout JSON-line protocol, streams chunk and done events back as an async iterable
- **`src/processes/sub-agent-entry.ts`** — Sub-agent process entry point: receives task via stdin, runs `agentTurn` with its own provider/model/tools/identity, streams response chunks and final result to stdout
- **`src/tools/builtin/sub_agent.ts`** — `sub_agent` tool: agents can delegate independent tasks to sub-agents with configurable agent ID, model, provider, tools, system prompt; runs concurrently and returns full response
- **`src/services/manager.ts`** — Micro-service registry and lifecycle manager:
  - `registerService`, `listServices`, `getService`, `updateService`, `deleteService` — CRUD for service definitions in cortex.db
  - `startService`, `stopService` — spawn/kill service processes with PID tracking
  - Health monitoring loop with configurable interval
  - Auto-restart with exponential backoff on crash
  - `startAutoServices` — boot-time launch of auto-start services
- **`src/processes/service-entry.ts`** — Service process entry point: runs a persistent agent with HTTP server (if port configured), handles `/chat` and `/health` endpoints
- **`src/cli/service-cmd.ts`** — `cortex service` CLI command with 7 subcommands: list, show, create, update, delete, start, stop
- **`src/db/migrations/010_services.sql`** — services table with fields for agent config, port, health check, auto-restart, env vars
- **Service API endpoints** in `src/server/router.ts`: CRUD + start/stop for services
- **Web UI Services page** — service cards with status indicator, start/stop buttons, agent/model/tools/port details
- `sub_agent` tool registered in both WebSocket chat (`src/server/ws.rs`) and CLI chat (`src/cli/chat.ts`)

### Changed
- **`src/db/migrate.ts`** — registered 010_services.sql migration for cortex.db
- **`src/main.ts`** — registered `service` command
### Changed
- **`src/config/config.ts`** — added `agents: Record<string, AgentConfig>` and `defaultAgent: string` to `CortexConfig`; `saveConfig()` auto-ensures default agent always exists
- **`src/main.ts`** — registered `agent` command

