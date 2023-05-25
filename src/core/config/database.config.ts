import { registerAs } from '@nestjs/config';
import { PoolConfig } from 'pg';

export const databaseConfig = registerAs<PoolConfig>('db', () => ({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'postgres',
  max: Number(process.env.MAXPOOLSIZE) || 1,
  idleTimeoutMillis: 500,
  statement_timeout: 5000,
}));
