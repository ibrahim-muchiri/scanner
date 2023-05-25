import { Inject, Injectable, Logger } from '@nestjs/common';
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { NunjuckService } from '../../template-engine/nunjuck-service/nunjuck.service';
import { TemplateOptions } from '../../template-engine/template-engine.model';
import { ApiFixture, ApiGroup, ApiLeague, ApiRound, ApiSeason, ApiStage, SportMonksResponse } from '../models';
import { ApiTeamCrawler } from './api-team.crawler';

@Injectable()
export class ApiSeasonCrawler {
  constructor(
    private engine: NunjuckService,
    @Inject('AXIOS') private axiosInstance: AxiosInstance,
    private teamCrawler: ApiTeamCrawler,
  ) {}

  async runAll() {
    const config: AxiosRequestConfig = {
      params: {
        // include: 'league, stages, rounds, fixtures',
      },
    };
    const res = await this.axiosInstance.get<SportMonksResponse<ApiSeason[]>>(`/seasons`, config);
    const data = res.data.data;

    const o: TemplateOptions<ApiSeason[]> = {
      templateFilename: 'season.njk',
      outputFilename: `./generated-sql/api/seasons.data.sql`,
      data,
    };

    this.engine.renderAndSaveFile(o);
  }

  async run(id: number | string) {
    Logger.log('Crawl season ' + id);

    const config: AxiosRequestConfig = {
      params: {
        include: 'league, stages, rounds, groups, fixtures, fixtures.odds',
        markets: 1, // 3-way result
        bookmakers: 150, // bwin
      },
    };
    let res: AxiosResponse<SportMonksResponse<ApiSeason>>;

    try {
      res = await this.axiosInstance.get<SportMonksResponse<ApiSeason>>(`/seasons/${id}`, config);
    } catch (error) {
      console.log(`${error.message} --> ${error.config.url}`);
      return;
    }

    const data = res.data.data;

    this.processSeason(id, [data]);
    this.processLeague(id, [data.league.data]);
    this.processStages(id, data.stages.data);
    this.processRounds(id, data.rounds.data);
    this.processGroups(id, data.groups.data);
    this.processFixtures(id, data.fixtures.data);

    await this.teamCrawler.run(id as number);
  }

  private processSeason(seasonId: number | string, data: ApiSeason[]) {
    const o: TemplateOptions<ApiSeason[]> = {
      templateFilename: 'season.njk',
      outputFilename: `./generated-sql/api/season-${seasonId}/season-${seasonId}-base.data.sql`,
      data,
    };

    this.engine.renderAndSaveFile(o);
  }

  private processFixtures(seasonId: number | string, data: ApiFixture[]) {
    const o: TemplateOptions<ApiFixture[]> = {
      templateFilename: 'fixture.njk',
      outputFilename: `./generated-sql/api/season-${seasonId}/season-${seasonId}-fixtures.data.sql`,
      data,
    };

    this.engine.renderAndSaveFile(o);
  }

  private processRounds(seasonId: number | string, data: ApiRound[]) {
    const o: TemplateOptions<ApiRound[]> = {
      templateFilename: 'round.njk',
      outputFilename: `./generated-sql/api/season-${seasonId}/season-${seasonId}-rounds.data.sql`,
      data,
    };

    this.engine.renderAndSaveFile(o);
  }

  private processStages(seasonId: number | string, data: ApiStage[]) {
    const o: TemplateOptions<ApiStage[]> = {
      templateFilename: 'stage.njk',
      outputFilename: `./generated-sql/api/season-${seasonId}/season-${seasonId}-stages.data.sql`,
      data,
    };

    this.engine.renderAndSaveFile(o);
  }

  private processGroups(seasonId: number | string, data: ApiGroup[]) {
    const o: TemplateOptions<ApiGroup[]> = {
      templateFilename: 'group.njk',
      outputFilename: `./generated-sql/api/season-${seasonId}/season-${seasonId}-groups.data.sql`,
      data,
    };

    this.engine.renderAndSaveFile(o);
  }

  private processLeague(seasonId: number | string, data: ApiLeague[]) {
    const o: TemplateOptions<ApiLeague[]> = {
      templateFilename: 'league.njk',
      outputFilename: `./generated-sql/api/season-${seasonId}/season-${seasonId}-league.data.sql`,
      data,
    };

    this.engine.renderAndSaveFile(o);
  }
}
