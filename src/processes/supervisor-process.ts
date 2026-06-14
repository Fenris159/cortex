import { pingProcess, ensureSocketDir, VALIDATOR_SOCK, EXECUTOR_SOCK, SCHEDULER_SOCK } from '../ipc/transport.ts';

interface ProcDef {
  name: string;
  label: string;
  entry: string;
  sock: string;
  permissions: string[];
}

const PROCESS_DEFS: ProcDef[] = [
  {
    name: 'validator',
    label: 'Cortex Validator',
    entry: './validator-process.ts',
    sock: VALIDATOR_SOCK,
    permissions: ['--allow-read', '--allow-write', '--allow-net', '--allow-env', '--allow-sys', '--allow-ffi'],
  },
  {
    name: 'executor',
    label: 'Cortex Executor',
    entry: './executor-process.ts',
    sock: EXECUTOR_SOCK,
    permissions: ['--allow-read', '--allow-write', '--allow-run', '--allow-net', '--allow-env', '--allow-sys', '--allow-ffi'],
  },
  {
    name: 'scheduler',
    label: 'Cortex Scheduler',
    entry: './scheduler-process.ts',
    sock: SCHEDULER_SOCK,
    permissions: ['--allow-read', '--allow-write', '--allow-run', '--allow-net', '--allow-env', '--allow-sys', '--allow-ffi'],
  },
];

const parentsToKill = new Set<number>();

async function spawnDaemon(proc: ProcDef): Promise<Deno.ChildProcess> {
  await ensureSocketDir();
  const entryPath = new URL(proc.entry, import.meta.url).pathname;
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ['run', ...proc.permissions, entryPath],
    stdout: 'null',
    stderr: 'null',
    stdin: 'null',
  });
  const child = cmd.spawn();
  parentsToKill.add(child.pid);
  return child;
}

async function supervise(): Promise<void> {
  const children = new Map<string, { proc: ProcDef; process: Deno.ChildProcess; restartCount: number }>();

  async function startOne(proc: ProcDef): Promise<void> {
    const existing = children.get(proc.name);
    const restartCount = existing ? existing.restartCount + 1 : 0;

    if (restartCount > 0) {
      const delay = Math.min(Math.pow(2, restartCount) * 1000, 30000);
      console.log(`[supervisor] ${proc.label} crashed. Restarting in ${delay / 1000}s (attempt ${restartCount})...`);
      await new Promise((r) => setTimeout(r, delay));
    }

    const process = await spawnDaemon(proc);
    children.set(proc.name, { proc, process, restartCount });
    console.log(`[supervisor] ${proc.label} started (pid ${process.pid})`);

    // Monitor exit in background
    (async () => {
      const status = await process.status;
      parentsToKill.delete(process.pid);
      if (!children.has(proc.name)) return;
      console.log(`[supervisor] ${proc.label} exited (code ${status.code})`);
      if (status.code !== 0) {
        children.delete(proc.name);
        startOne(proc);
      } else {
        children.delete(proc.name);
      }
    })();
  }

  // Start all processes
  for (const proc of PROCESS_DEFS) {
    await startOne(proc);
  }

  // Handle shutdown
  const shutdown = async () => {
    console.log('\n[supervisor] Shutting down...');
    for (const [name, child] of children) {
      try { child.process.kill('SIGTERM'); } catch { /* ignore */ }
      children.delete(name);
    }
    Deno.exit(0);
  };

  try {
    Deno.addSignalListener('SIGINT', shutdown);
    Deno.addSignalListener('SIGTERM', shutdown);
  } catch {
    // signal listeners not available in all Deno runtimes
  }

  // Block forever
  await new Promise(() => {});
}

await supervise();
