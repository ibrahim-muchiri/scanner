import { Body, Controller, Get, Inject, Param, Post, Res } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { EventEmitter2 } from 'eventemitter2';
import { Response } from 'express';
import { crawlConfig } from '../core/config';
import { DbMockService } from './db-mock.service';
import { DateSetBackEvent } from './models/date-set-event.model';
import { SetBackSeason } from './models/set-back-season.model';

@Controller('db-mock')
export class DbMockController {
  constructor(
    @Inject(crawlConfig.KEY)
    private readonly config: ConfigType<typeof crawlConfig>,
    private mockService: DbMockService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('season/:id')
  async getBundesliga(@Param('id') id: number): Promise<string> {
    // bundesliga = 17361; 20/21
    // bundesliga = 18444; 21/22
    const response = await this.mockService.retrieveBundesliga(id);
    return response;
  }

  @Get()
  root(@Res() res: Response) {
    return res.render('index.html');
  }

  @Get('fixturesOfAllSeasons')
  async getFixturesOfAvailableSeasons() {
    const leagues = await this.mockService.getAvailableLeagues();
    const seasons = leagues.map((e) => {
      const fixtures = this.mockService.transformFixtureData(e.season.data.fixtures?.data, e.season.data.teams?.data);

      return {
        name: `${e.name} ${e.season.data.name}`,
        htmlId: `${e.season.data.id}`,
        fixtures: fixtures,
        teams: e.season.data.teams.data,
      };
    });

    return seasons;
  }

  @Get(':view')
  async index(@Res() res: Response, @Param('view') view: string) {
    if (!this.config.mockApi) {
      throw new Error('Set back season is only available in mock mode! ');
    }

    const leagues = await this.mockService.getAvailableLeagues();
    const seasons = leagues.map((e) => {
      // devide Fixtures in 2 colums
      const fixtures = this.mockService.transformFixtureData(e.season.data.fixtures?.data, e.season.data.teams?.data);
      const half = Math.ceil(fixtures.length / 2);
      const fixturesFirstHalf = fixtures.slice(0, half);
      const fixturesSecondHalf = fixtures.slice(half, fixtures.length);

      return {
        name: `${e.name} ${e.season.data.name}`,
        htmlId: `${e.season.data.id}`,
        fixturesFirstHalf: fixturesFirstHalf,
        fixturesSecondHalf: fixturesSecondHalf,
        teams: e.season.data.teams.data,
      };
    });

    // first nonce is the style nonce, so this cant be used for script nonces
    const nonces = {
      seasons: seasons,
      styleNonce: this.config.scriptNonces[0],
    };
    for (let i = 1; i < this.config.scriptNonces.length; i++) {
      nonces[`nonce${i}`] = this.config.scriptNonces[i];
    }
    return res.render(`${view}.html`, nonces);
  }

  @Post()
  async create(@Body() setBackSeasonDto: SetBackSeason): Promise<string> {
    const matchingSeasonId = this.config.seasons.includes(setBackSeasonDto.seasonId);
    if (this.config.mockApi) {
      const response = await this.mockService.setBackSeason(
        setBackSeasonDto.seasonId,
        setBackSeasonDto.date_time,
        setBackSeasonDto.includeGame,
      );
      if (this.config.crawlMode == 'once' && matchingSeasonId) {
        this.eventEmitter.emit('date.set', new DateSetBackEvent(setBackSeasonDto.seasonId, response));
      }

      return matchingSeasonId ? response : `Season ${setBackSeasonDto.seasonId} doesn't exist in .env! Nothing to do..`;
    } else {
      return 'No manipulation possible in Sportmonks API mode!';
    }
  }
}
