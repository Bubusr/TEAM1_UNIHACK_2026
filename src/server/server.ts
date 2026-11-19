import 'dotenv/config';
import { createApp, startServer } from './app.ts';

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught exception in server process:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled promise rejection at:', promise, 'reason:', reason);
});

export { createApp, startServer };

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js'));

if (isMain) {
  startServer().catch((err) => {
    console.error(
      'Fatal server startup error:',
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  });
}
