import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  ...(config.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        requestId: req.id,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
    err: pino.stdSerializers.err,
  },
});

export type Logger = typeof logger;
