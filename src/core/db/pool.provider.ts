import { Logger } from '@nestjs/common';
import { FactoryProvider } from '@nestjs/common/interfaces';
import { ConfigType } from '@nestjs/config';
import { Pool, PoolConfig } from 'pg';
import { databaseConfig } from '../config';

async function createPool(config: PoolConfig) {
  const pool = new Pool(config);
  // the pool will emit an error on behalf of any idle clients it contains
  // if a backend error or network partition happens
  pool.on('error', (err) => {
    Logger.error('Unexpected error on idle client (pool)', err.stack);
    process.exit(-1);
  });
  // maximum number of clients the pool should contain
  // by default this is set to 10.
  Logger.log(`Pool created with ${config.max} clients. Waiting for work...`, 'Config');
  return pool;
}

export const POOL_TOKEN = 'POOL';

export const PoolProvider: FactoryProvider<Promise<Pool>> = {
  provide: POOL_TOKEN,
  useFactory: async (config: ConfigType<typeof databaseConfig>) => {
    if (!config.user || !config.host || !config.database || !config.password || !config.port) {
      throw new Error('No database config provided! Use .env file if you are in development.');
    }
    Logger.log(`Connecting to database: ${config.host}:${config.port}/${config.database}`, 'Config');
    return await createPool(config);
  },
  inject: [databaseConfig.KEY],
};

// How and where?
// async end() {
//   Logger.log('Try to close db connection');
//   if (this.pool) {
//     await this.pool.end();
//   }
//   Logger.log('Pool has drained, connection closed');
// }
