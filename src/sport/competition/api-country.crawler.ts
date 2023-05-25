import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { crawlConfig } from '../../core/config';
import { Crawler } from '../../core/crawler.interface';
import { FileWriter } from '../../db-mock/file-writer';
import { NunjuckService } from '../../template-engine/nunjuck-service/nunjuck.service';
import { BettlesApi } from '../bettles.api';
import { SportApi } from '../sportmonks.api';

@Injectable()
export class ApiCountryCrawler implements Crawler {
  private readonly logger = new Logger(ApiCountryCrawler.name);
  private version = '0.1.0';
  private timeout = 30000;
  private timeoutHandle: NodeJS.Timeout;

  constructor(
    @Inject(crawlConfig.KEY) private readonly config: ConfigType<typeof crawlConfig>,
    private engine: NunjuckService,
    private readonly sportApi: SportApi,
    private readonly bettles: BettlesApi,
    private readonly writer: FileWriter,
  ) {
    // if (config.autorun) {
    //   this.setup();
    // }
    this.runOnce();
  }

  async setup() {
    if (this.config.crawlMode === 'once') {
      return this.runOnce();
    } else {
      return this.run();
    }
  }

  async run() {
    this.logger.log(
      `Start scanning (forever!) countries with version: ${this.version} and timeout: ${this.timeout} ms`,
    );
    const data = await this.sportApi.fetchAvailableCountries();
    await this.bettles.updateCountries(data);
    this.logger.verbose(`Next cycle in ${this.config.refreshTimeout / 1000} seconds.`);
    this.timeoutHandle = setTimeout(this.run.bind(this), this.config.refreshTimeout);
  }

  async runOnce() {
    this.logger.log(`Start scanning countries! with version: ${this.version} and timeout: ${this.timeout} ms`);
    const data = await this.sportApi.fetchAvailableCountries();

    if (this.config.persistAsJson) {
      this.logger.verbose(`Persist JSON files to file system for countries`);
      const outputFilename = `${this.config.mockDbPath}/_all/countries.json`;
      await this.writer.writeJsonFile(outputFilename, data);
    }

    await this.bettles.updateCountries(data);
  }

  async stop() {
    clearTimeout(this.timeoutHandle);
  }
}
