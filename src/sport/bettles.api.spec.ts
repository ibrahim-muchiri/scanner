import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { BettlesApi } from './bettles.api';
import { NunjuckService } from '../template-engine/nunjuck-service/nunjuck.service';
import { HashService } from '../core/hash/hash.service';
import { ScannerApi } from './scanner.api';
import { crawlConfig } from '../core/config';

export const MAX_ATTEMPTS = 10;

describe('BettlesApi Save Funtion Test', () => {
  let bettlesApi: BettlesApi;
  let pool: Pool;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ConfigService,
        BettlesApi,
        NunjuckService,
        HashService,
        ScannerApi,
        {
          provide: Pool,
          useValue: new Pool(),
        },
        {
          provide: crawlConfig.KEY,
          useValue: { persistToDb: true },
        },
      ],
    }).compile();

    bettlesApi = moduleRef.get<BettlesApi>(BettlesApi);
    pool = moduleRef.get<Pool>(Pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should successfully save the query', async () => {
    const sql = 'SELECT * FROM table';
    const log = 'Test Log';

    await expect(bettlesApi.save(sql, log)).resolves.toBeUndefined();
  });

  it('should handle retries and reach maximum attempts', async () => {
    const sql = 'SELECT * FROM table';
    const log = 'Test Log';

    await expect(bettlesApi.save(sql, log, MAX_ATTEMPTS)).resolves.toBeUndefined();
  });
});
