import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { Crawler } from '../../core/crawler.interface';
import { exponentialBackOff } from '../../core/network/exponential-back-off.func';
import { Repeater } from '../../core/network/repeater.class';
import { SchedulerService } from '../../schedule/scheduler.service';
import { NunjuckService } from '../../template-engine/nunjuck-service/nunjuck.service';
import { TemplateOptions } from '../../template-engine/template-engine.model';
import { MAX_ATTEMPTS } from '../bettles.api';

import { ApiFixture } from '../models';
import { SportmonksApi } from '../sportmonks.api';

@Injectable()
export class ApiScannerLive implements Crawler {
  private version = '0.3.0';
  private timeout = 60000;
  private readonly logger = new Logger(ApiScannerLive.name);

  constructor(
    @Inject('POOL') private pool: Pool,
    private api: SportmonksApi,
    private engine: NunjuckService,
    private scheduler: SchedulerService,
  ) {
    this.run();
  }

  async run() {
    Logger.log(
      `Start scanning live data with version: ${this.version} and timeout: ${this.timeout} ms`,
      ApiScannerLive.name,
    );
    await this.fetch();
  }

  async stop() {
    // nothing to see
  }

  async fetch(attempts = 0) {
    let data: ApiFixture[];

    try {
      data = await this.api.fetchLive();
    } catch (e) {
      if (attempts >= 30) {
        Logger.error(`Too many attempts: ${attempts}. Giving up...`, null, ApiScannerLive.name);
        return;
      }
      // Todo: Log message: e.message
      Repeater.retry(this.fetch.bind(this, ++attempts), attempts);
      return;
    }

    const schedule = this.scheduler.extractSchedule(data);

    Logger.debug(`Schedule is: ${schedule}`, ApiScannerLive.name);

    const action = this.scheduler.processSchedule(schedule);
    if (data && data.length > 0) {
      this.update(data);
    }
    this.timeout = action.timeout;
    Logger.verbose(`Next cycle in ${this.timeout / 1000} seconds`, ApiScannerLive.name);
    setTimeout(this.fetch.bind(this), this.timeout);
  }

  update(fixtures: ApiFixture[]) {
    if (fixtures && fixtures.length > 0) {
      const json = JSON.stringify(fixtures);
      const context: TemplateOptions<ApiFixture[]> = {
        outputFilename: `./generated-sql/api/update-live.data.sql`, // for debugging
        templateFilename: 'update-fixtures.njk',
        data: fixtures,
        meta: {
          type: 'LIVE',
          hash: 'empty',
          log: `automatic update from scanner ${this.version}`,
          json,
        },
      };
      const content = this.engine.render(context);
      return this.save(content, 'live scanner');

      // this.pool
      //   .query(content)
      //   .then(() =>
      //     Logger.log(
      //       `Successfully updated live data of ${fixtures.length} fixtures`,
      //       ApiScannerLive.name,
      //     ),
      //   )
      //   .catch((err) => {
      //     const delay = exponentialBackOff(++attempts);
      //     const exitOnFail = false; //!options.retryOnInitFail;
      //     const message = `Connect to database failed: ${err.errno} --> (attempt ${attempts}). We'll try again in ${delay}ms.`;
      //     Logger.error(message, null, ApiScannerLive.name);
      //     if (exitOnFail) {
      //       process.exit(34);
      //     }
      //     setTimeout(this.update.bind(this, fixtures, attempts), delay);
      //   });
    }
  }

  private async save(sql: string, log: string, attempts = 0) {
    if (!sql) {
      this.logger.verbose(`Nothing to save. Query is empty.`);
      return;
    }

    // and push it to database
    const client = await this.pool.connect();
    try {
      await client.query(sql);
      this.logger.verbose(`Successfully updated ${log}`);
    } catch (err) {
      this.logger.error(`An error occurred: ${err} while processing ${log}. Retrying...`);
      if (attempts < MAX_ATTEMPTS) {
        Repeater.retry(this.save.bind(this, sql, log, ++attempts), attempts);
      } else {
        this.logger.warn(`MAX_ATTEMPTS (${MAX_ATTEMPTS}) reached. Aborted ${log}`);
      }
    } finally {
      client.release();
    }
  }
}
