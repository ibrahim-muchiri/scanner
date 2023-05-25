import { Inject, Injectable, Logger } from '@nestjs/common';
import { crawlConfig } from 'src/core/config';
import { ConfigType } from '@nestjs/config';
import { SportApi } from '../sportmonks.api';
import { BettlesApi } from '../bettles.api';
import { FileWriter } from 'src/db-mock/file-writer';

@Injectable()
export class ApiStandingCrawler {
  private readonly logger = new Logger(ApiStandingCrawler.name);
  private version = '0.3.0';
  private timeoutHandle: NodeJS.Timeout;
  #seasonIds: number[] | null;

  constructor(
    @Inject(crawlConfig.KEY)
    private readonly config: ConfigType<typeof crawlConfig>,
    private readonly api: SportApi,
    private readonly bettles: BettlesApi,
    private readonly writer: FileWriter,
  ) {
    if (config.autorun) {
      this.setup();
    }
  }

  async setup() {
    if (this.config.standings) {
      const seasonMode = this.config.seasonMode;
      if (seasonMode === 'manual') {
        this.#seasonIds = this.config.seasons;
      }
      if (seasonMode === 'auto') {
        this.#seasonIds = await this.fetchCurrentSeasonIdsFromAvailableLeagues();
      }
      if (this.config.crawlMode === 'once') {
        this.logger.log(`Start scanning seasons with version ${this.version} once`);
        return this.runOnce();
      } else {
        this.logger.log(
          `Start scanning (forever!) seasons with version ${this.version} and timeout ${this.config.refreshTimeout} ms`,
        );
        return this.run();
      }
    } else {
      return this.logger.warn('Standings will not be crawled!');
    }
  }

  async run() {
    await this.runOnce();
    this.timeoutHandle = setTimeout(this.run.bind(this), this.config.refreshTimeout);
  }

  async runOnce() {
    try {
      for (const id of this.#seasonIds) {
        const standings = await this.api.fetchSeasonStandings(id);
        if (this.config.persistToDb) {
          await this.bettles.updateLeagueStandings(standings);
        }
        if (this.config.persistAsJson) {
          this.writer.createStandingsJson(id, standings);
        }
      }
    } catch (error) {
      this.logger.error(`${error.message} --> ${error.config?.url}`, error.stack);
    }
  }

  async stop() {
    clearTimeout(this.timeoutHandle);
  }

  //Todo: Put to API helper service and remove duplicate (Base class?)
  /**
   * Sometimes we want to know which seasons are available (unlocked by Sport Data Provider) and currently running.
   * This method fetches and extract those information from the API.
   */
  private async fetchCurrentSeasonIdsFromAvailableLeagues(): Promise<number[]> {
    try {
      const data = await this.api.fetchAvailableLeaguesWithCurrentSeasons();
      if (data) {
        const relevantSeasonIds = data.map((value) => value.season.data.id);
        this.logger.debug(`Mock API: ${this.config.mockApi}, Could crawl the following seasons: ${relevantSeasonIds}`);
        return relevantSeasonIds;
      }
    } catch (error) {
      Logger.error(`${error.message} --> ${error.config?.url}`, error.stack);
    }
  }
}
