import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../queue/setup.js';

function createStore(prefix: string) {
  return new RedisStore({
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<any>,
    prefix: `rl:${prefix}:`,
  });
}

export const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('read'),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('write'),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('auth'),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts' } },
});

export const importLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('import'),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many import requests' } },
});
