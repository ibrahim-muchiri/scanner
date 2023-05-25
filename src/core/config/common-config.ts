import { LogLevel } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { randomBytes } from 'crypto';

export type Environment = 'production' | 'development';

export interface CommonConfig {
  port: number;
  logLevel: string[];
  env: Environment;
  /// An array of secure inline script nonces
  scriptNonces: string[];
}

export const commonConfig = registerAs<CommonConfig>('common', () => ({
  port: Number(process.env.PORT) || 3000,
  logLevel: extractLogLevel(process.env.LOG_LEVEL),
  env: 'development',
  scriptNonces: createNonces(),
}));

function createNonces(): string[] {
  // randomly create 10 nonces, each html tag must have a unique nonce
  const nonces: string[] = [];
  for (let i = 0; i < 10; i++) {
    nonces.push(randomBytes(16).toString('hex'));
  }
  return nonces;
}

export function extractLogLevel(value: string): LogLevel[] {
  const logLevels = value
    ?.split(',')
    .map((e) => e.toLowerCase().trim())
    .filter((e) => ['log', 'error', 'warn', 'debug', 'verbose'].includes(e));

  if (!logLevels || logLevels.length === 0) {
    return ['log', 'error', 'warn', 'debug', 'verbose'];
  }

  return logLevels as LogLevel[];
}
