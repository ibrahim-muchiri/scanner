import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Pool } from 'pg';
import { DateSetBackEvent } from 'src/db-mock/models/date-set-event.model';
import { crawlConfig } from '../../core/config';
import { Crawler } from '../../core/crawler.interface';
import { POOL_TOKEN } from '../../core/db/pool.provider';
import { HashService } from '../../core/hash/hash.service';
import { FileWriter } from '../../db-mock/file-writer';
import { NunjuckService } from '../../template-engine/nunjuck-service/nunjuck.service';
import { BettlesApi } from '../bettles.api';
import { SeasonCleaner } from '../season-cleaner';
import { SportApi } from '../sportmonks.api';

@Injectable()
export class ApiCurrentSeasonsCrawler implements Crawler {
  private readonly logger = new Logger(ApiCurrentSeasonsCrawler.name);
  private version = '0.2.2';
  private timeoutHandle: NodeJS.Timeout;
  #validSeasonIds: number[] | null;

  constructor(
    @Inject(POOL_TOKEN) private readonly pool: Pool,
    @Inject(crawlConfig.KEY)
    private readonly config: ConfigType<typeof crawlConfig>,
    private readonly api: SportApi,
    private readonly engine: NunjuckService,
    private readonly cleaner: SeasonCleaner,
    private readonly hasher: HashService,
    private readonly bettles: BettlesApi,
    private readonly writer: FileWriter,
  ) {
    if (config.autorun) {
      this.setup();
    }
  }

  @OnEvent('date.set')
  async handleSetDateEvent(payload: DateSetBackEvent) {
    await this.fetchSeasons([payload.seasonId]);
    this.logger.log(payload.message);
  }

  async setup() {
    const seasonMode = this.config.seasonMode;
    if (seasonMode === 'manual') {
      this.#validSeasonIds = this.config.seasons;
    }
    if (seasonMode === 'auto') {
      this.#validSeasonIds = await this.fetchCurrentSeasonIdsFromAvailableLeagues();
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
  }

  async run() {
    await this.fetchSeasons(this.#validSeasonIds);
    this.logger.verbose(`Next cycle in ${this.config.refreshTimeout / 1000} seconds.`);
    this.timeoutHandle = setTimeout(this.run.bind(this), this.config.refreshTimeout);
  }

  async runOnce() {
    await this.fetchSeasons(this.#validSeasonIds);
    this.logger.log(`Scanning complete!`);
  }

  async stop() {
    clearTimeout(this.timeoutHandle);
  }

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

  /**
   * Fetch the seasons for the provided IDs.
   *
   * @param ids - The relevant season IDs.
   */
  private async fetchSeasons(ids: number[]) {
    if (ids?.length > 0) {
      for (const id of ids) {
        try {
          this.logger.verbose(`Fetching season: ${id}`);
          const season = await this.api.fetchFullSeason(id);

          this.logger.verbose(`Fetching teams of season: ${season.id}`);
          const teams = await this.api.fetchTeamsOfSeason(season.id);
          const cleanedSeason = this.cleaner.cleanFixturesOfSeason(season);
          cleanedSeason.teams.data = teams;
          if (cleanedSeason) {
            await this.bettles.updateTeamsOfSeason(cleanedSeason);
            await this.bettles.updateSeason(cleanedSeason);
            await this.bettles.updateStagesOfSeason(cleanedSeason);
            await this.bettles.updateRoundsOfSeason(cleanedSeason);
            await this.bettles.updateGroupsOfSeason(cleanedSeason);
            await this.bettles.updateLeagueOfSeason(cleanedSeason);
            await this.bettles.updateFixturesOfSeason(cleanedSeason);
          }
          if (this.config.persistAsJson) {
            this.logger.verbose(`Persist JSON files to file system for season: ${season.id}`);
            this.writer.createSeasonJsons(season, teams);
          }
        } catch (error) {
          this.logger.error(`${error.message} --> ${error.config?.url}`, error.stack);
        }
      }
    }
  }
}
