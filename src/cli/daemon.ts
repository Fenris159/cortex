import { Command } from '@cliffy/command';
import { bold, green, red, dim, cyan } from '@std/fmt/colors';
import { pingProcess, VALIDATOR_SOCK, EXECUTOR_SOCK, SCHEDULER_SOCK } from '../ipc/transport.ts';

const PROCESS_DEFS = [
  { name: 'validator', label: 'Cortex Validator', sock: VALIDATOR_SOCK },
  { name: 'executor', label: 'Cortex Executor', sock: EXECUTOR_SOCK },
  { name: 'scheduler', label: 'Cortex Scheduler', sock: SCHEDULER_SOCK },
] as const;

/** Start the daemon supervisor in the background if not already running. Used by chat/serve for auto-start. */
export async function ensureDaemons(): Promise<void> {
  const alive = await pingProcess(VALIDATOR_SOCK);
  if (alive) return;

  const supervisorPath = new URL('../processes/supervisor-process.ts', import.meta.url).pathname;
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-all', supervisorPath],
    stdout: 'null',
    stderr: 'null',
    stdin: 'null',
  });
  cmd.spawn();

  // Wait up to 6s for at least one daemon to be ready
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (await pingProcess(VALIDATOR_SOCK)) return;
  }
}

// ── CLI commands ────────────────────────────────────────────

export const daemonCommand = new Command()
  .name('daemon')
  .description('Manage Cortex background processes (validator, executor, scheduler)')
  .command(
    'start',
    new Command()
      .description('Start the Cortex daemon supervisor in the background')
      .action(async () => {
        const supervisorEntry = '../processes/supervisor-process.ts';
        const supervisorPath = new URL(supervisorEntry, import.meta.url).pathname;

        // Check if supervisor is already running
        if (await pingProcess(VALIDATOR_SOCK)) {
          console.log(dim('  Daemon supervisor is already running.'));
          Deno.exit(0);
        }

        const cmd = new Deno.Command(Deno.execPath(), {
          args: ['run', '--allow-all', supervisorPath],
          stdout: 'null',
          stderr: 'null',
          stdin: 'null',
        });

        cmd.spawn();
        console.log(green('  ✓ Cortex daemon supervisor started in background'));

        // Brief wait for processes to come online
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 200));
          if (await pingProcess(VALIDATOR_SOCK)) break;
        }

        Deno.exit(0);
      }),
  )
  .command(
    'run',
    new Command()
      .description('Run the daemon supervisor in the foreground (for systemd/tmux)')
      .action(async () => {
        const supervisorEntry = '../processes/supervisor-process.ts';
        const supervisorPath = new URL(supervisorEntry, import.meta.url).pathname;

        const cmd = new Deno.Command(Deno.execPath(), {
          args: ['run', '--allow-all', supervisorPath],
          stdout: 'inherit',
          stderr: 'inherit',
          stdin: 'inherit',
        });

        const child = cmd.spawn();
        const status = await child.status;
        Deno.exit(status.code ?? 1);
      }),
  )
  .command(
    'status',
    new Command()
      .description('Show status of Cortex background processes')
      .action(async () => {
        console.log(bold('Cortex Daemon Status'));
        console.log('─'.repeat(40));
        for (const proc of PROCESS_DEFS) {
          const alive = await pingProcess(proc.sock);
          const status = alive ? green('● running') : red('○ stopped');
          console.log(`  ${status}  ${bold(proc.label)}  ${dim(proc.sock)}`);
        }
      }),
  )
  .command(
    'stop',
    new Command()
      .description('Stop all Cortex background processes')
      .action(async () => {
        const patterns = ['supervisor-process', 'validator-process', 'executor-process', 'scheduler-process'];
        for (const pat of patterns) {
          try {
            const cmd = new Deno.Command('pkill', { args: ['-f', pat] });
            await cmd.output();
            console.log(cyan(`  Stopped: ${pat}`));
          } catch {
            console.log(dim(`  Not running: ${pat}`));
          }
        }
      }),
  );
