import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { HashService } from '../core/hash/hash.service';
import { POOL_TOKEN } from '../core/db/pool.provider';
import { ScannerLogEntry, ScannerLogEntryType } from '../template-engine/template-engine.model';
import { ScannerLog } from './scanner-log.model';

@Injectable()
export class ScannerApi {
  private static VERSION = '0.3.0'; // Todo: use commit hash somehow
  private readonly logger = new Logger(ScannerApi.name);
  private readonly cache: Map<string | number, ScannerLog> = new Map();

  constructor(@Inject(POOL_TOKEN) private pool: Pool, private hasher: HashService) {}

  getFromCache(key: string | number) {
    return this.cache.get(key);
  }

  getHashFromCache(key: string | number) {
    return this.cache.get(key)?.hash;
  }

  /**
   * Reset (clear) the in memory database holding our previous hashes.
   */
  reset() {
    this.cache.clear();
  }

  /**
   * Select the current (last modified) hash ids to fill our in memory hash map (cache).
   */
  async fetchCurrentHashesFromDatabase() {
    const client = await this.pool.connect();

    // first, clear the cache, because we re-fetch all relevant stuff
    this.cache.clear();

    try {
      const query =
        'select distinct on (identifier) identifier, type, hash, created_at from app_public.scanner_log order by identifier, created_at desc';
      const result = await client.query(query);
      const ids: string[] = [];
      for (const row of result.rows) {
        ids.push(row.identifier);
        this.cache.set(row.identifier, {
          type: row.type,
          id: row.identifier,
          hash: row.hash,
        });
      }
      this.logger.verbose(`Updated cache with identifiers (hashes) from scanner log table`);
      this.logger.debug(ids.length > 0 ? `➡ Found hashes are "${ids.join(',')}"` : `No found hashes`);
    } catch (error) {
      // Todo: What to do here?
      this.logger.error(`Error while fetching last updated logs from scanner table: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Create a log entry for the database scanner log table.
   *
   * @param type - The type of the entry
   * @param data - Any kind of data
   * @param id - The identifier which hold our memory db entry
   */
  createLogEntry(type: ScannerLogEntryType, data: any, id?: string): ScannerLogEntry {
    const json = JSON.stringify(data).replace(/'/g, `''`);
    // to be able to check if response from sport data provider really has changed
    // we create a hash from it
    const hashFromData = this.hasher.generateHash(json);
    // and compare it with the previous one
    const isSame = this.getHashFromCache(id) === hashFromData;
    return {
      type,
      id,
      json,
      hash: hashFromData,
      isSameAsPrevious: isSame,
      log: `automatic update from scanner ${ScannerApi.VERSION}`,
    };
  }
}
