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

### Added
- **Command palette** — `Ctrl+K`/`Cmd+K` overlay for instant page navigation with search, keyboard arrows, and Enter to navigate
- **Sidebar quick search** — filter input at top of nav to show only matching pages
- **Sidebar section headers** — pages grouped into Core, Intelligence, Management, Configuration, Monitoring categories
- **Active nav indicator** — left accent bar on active page item

### Changed
- **Sidebar reorganized**: Chat moved to first position (primary page), sections with descriptive headers, improved visual hierarchy with active state indicator bar
- **Jobs page merged with Cron**: Cron modal moved into Jobs page, standalone Cron nav item removed, "+ New Job" button added to Jobs page header
- **Default landing page changed from Status to Chat** — more natural entry point
- **Activity page** (formerly Lens) renamed in nav for clarity
- Reduced net nav items from 16 to 15 by merging Cron into Jobs
