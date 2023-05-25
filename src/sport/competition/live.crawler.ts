import { Injectable, Logger } from '@nestjs/common';
import { Crawler } from '../../core/crawler.interface';
import { NunjuckService } from '../../template-engine/nunjuck-service/nunjuck.service';
import { BettlesApi } from '../bettles.api';
import { SportmonksApi } from '../sportmonks.api';

@Injectable()
export class LiveCrawler implements Crawler {
  private readonly logger = new Logger(LiveCrawler.name);
  private version = 'live-0.2.2';
  private timeout = 5000;
  private timeoutHandle: NodeJS.Timeout;

  constructor(
    private engine: NunjuckService,
    private readonly monks: SportmonksApi,
    private readonly bettles: BettlesApi,
  ) {
    this.run();
  }

  async run() {
    this.logger.log(
      `Start scanning live data (forever!) with version: ${this.version} and timeout: ${this.timeout} ms`,
    );
    await this.runForever();
  }

  async runOnce() {
    this.logger.log(`Start scanning live data (once) with version: ${this.version} and timeout: ${this.timeout} ms`);
    const data = await this.monks.fetchLive();
    await this.bettles.updateLiveFixtures(data);
  }

  async stop() {
    clearTimeout(this.timeoutHandle);
  }

  private async runForever() {
    const data = await this.monks.fetchLive();
    await this.bettles.updateLiveFixtures(data);
    this.logger.verbose(`Next cycle in ${this.timeout / 1000} seconds.`);
    this.timeoutHandle = setTimeout(this.runForever.bind(this), this.timeout);
  }
}
