import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { crawlConfig } from '../../core/config';
import { Crawler } from '../../core/crawler.interface';
import { FileWriter } from '../../db-mock/file-writer';
import { NunjuckService } from '../../template-engine/nunjuck-service/nunjuck.service';
import { BettlesApi } from '../bettles.api';
import { SportApi } from '../sportmonks.api';

// available placeholders
const ids = [
  260165, 260166, 260177, 260178, 260179, 260180, 260181, 260182, 260183, 260184, 260185, 260186, 260262, 260263,
  260264, 260265, 260266, 260267, 260268, 260269, 260270, 260271, 260272, 260273, 260274, 260275, 260276, 260277,
  260284, 260285, 260286, 260287,
];

@Injectable()
export class ApiPlaceholderCrawler implements Crawler {
  private readonly logger = new Logger(ApiPlaceholderCrawler.name);
  private version = '0.1.0';
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
      `Start scanning (forever!) placeholders with version: ${this.version} and timeout: ${
        this.config.refreshTimeout / 1000
      } seconds`,
    );
    const data = await this.sportApi.fetchAllPlaceholders(ids);
    await this.bettles.updateTeams(data);
    this.logger.verbose(`Next cycle in ${this.config.refreshTimeout / 1000} seconds.`);
    this.timeoutHandle = setTimeout(this.run.bind(this), this.config.refreshTimeout);
  }

  async runOnce() {
    this.logger.log(`Start scanning placeholders with version: ${this.version}`);
    const data = await this.sportApi.fetchAllPlaceholders(ids);

    if (this.config.persistAsJson) {
      this.logger.verbose(`Persist JSON files to file system for placeholders`);
      const outputFilename = `${this.config.mockDbPath}/_all/placeholders.json`;
      await this.writer.writeJsonFile(outputFilename, data);
    }

    await this.bettles.updateTeams(data);
  }

  async stop() {
    clearTimeout(this.timeoutHandle);
  }
}
