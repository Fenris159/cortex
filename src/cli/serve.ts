import { Command } from '@cliffy/command';
import { bold, green, dim, cyan } from '@std/fmt/colors';
import { startServer } from '../server/server.ts';

async function findServerProcess(
  port: number,
): Promise<{ pid: number; host: string } | null> {
  const pgrep = new Deno.Command('pgrep', { args: ['-f', 'cortex.*main.ts.*serve'] });
  const out = await pgrep.output();
  if (!out.success) return null;

  const pids = new TextDecoder().decode(out.stdout).trim().split('\n').map(Number).filter((p) => Boolean(p) && p !== Deno.pid);
  for (const pid of pids) {
    try {
      const cmdline = await Deno.readTextFile(`/proc/${pid}/cmdline`);
      const args = cmdline.split('\0');
      let host = '127.0.0.1';
      let foundPort = 3000;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--host' && i + 1 < args.length) host = args[i + 1];
        if (args[i] === '--port' && i + 1 < args.length) foundPort = Number(args[i + 1]);
      }
      if (foundPort === port) return { pid, host };
    } catch {
      continue;
    }
  }
  return null;
}

export const serveCommand = new Command()
  .name('serve')
  .description('Start the Cortex HTTP + WebSocket server with Web UI')
  .option('-p, --port <port:number>', 'Port to listen on', { default: 3000 })
  .option('-H, --host <host:string>', 'Host to bind to', { default: '127.0.0.1' })
  .option('-d, --daemon', 'Run the server in the background')
  .option('-r, --restart', 'Restart an existing background server (only with --daemon)')
  .action(async (opts: { port: number; host: string; daemon?: boolean; restart?: boolean }) => {
    if (opts.daemon) {
      if (opts.restart) {
        const existing = await findServerProcess(opts.port);
        if (existing) {
          try {
            Deno.kill(existing.pid, 'SIGTERM');
            console.log(cyan(`  Stopped existing server (pid ${existing.pid})`));
            await new Promise((r) => setTimeout(r, 1000));
          } catch {
            console.log(dim('  Could not stop existing server'));
          }
          // Use the original host from the running process, not the CLI default
          opts.host = existing.host;
        } else {
          console.log(dim(`  No existing server found on port ${opts.port}`));
        }
      }

      const cmd = new Deno.Command(Deno.execPath(), {
        args: [
          'run', '--allow-all',
          new URL('../main.ts', import.meta.url).pathname,
          'serve', '--port', String(opts.port), '--host', opts.host,
        ],
        stdout: 'null',
        stderr: 'null',
        stdin: 'null',
      });
      cmd.spawn();
      console.log(green(`  ✓ Cortex server started in background (http://${opts.host}:${opts.port})`));
      Deno.exit(0);
    }

    await startServer({ port: opts.port, host: opts.host });
  });
