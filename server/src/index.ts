import { buildApp } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { closeDb } from './db/index.js';
import { closeRedis } from './redis.js';

async function main() {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    try {
      await app.close();
      await closeDb();
      await closeRedis();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    const address = await app.listen({ port: config.PORT, host: config.HOST });
    logger.info({ address, env: config.NODE_ENV }, 'Server started');
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

void main();
