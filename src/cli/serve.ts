import { Command } from '@cliffy/command';
import { green } from '@std/fmt/colors';
import { startServer } from '../server/server.ts';

export const serveCommand = new Command()
  .name('serve')
  .description('Start the Cortex HTTP + WebSocket server with Web UI')
  .option('-p, --port <port:number>', 'Port to listen on', { default: 3000 })
  .option('-H, --host <host:string>', 'Host to bind to', { default: '127.0.0.1' })
  .option('-d, --daemon', 'Run the server in the background')
  .action(async (opts: { port: number; host: string; daemon?: boolean }) => {
    if (opts.daemon) {
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
