import { Injectable } from '@nestjs/common';
import { NunjuckService } from '../../template-engine/nunjuck-service/nunjuck.service';
import { TemplateOptions } from '../../template-engine/template-engine.model';
import { ApiTeam } from '../models';
import { SportmonksApi } from '../sportmonks.api';

@Injectable()
export class ApiTeamCrawler {
  constructor(private engine: NunjuckService, private readonly api: SportmonksApi) {}

  async run(id: number) {
    const data = await this.api.fetchTeamsOfSeason(id);
    const o: TemplateOptions<ApiTeam[]> = {
      templateFilename: 'team.njk',
      outputFilename: `./generated-sql/api/season-${id}/season-${id}-teams.data.sql`,
      data,
    };
    await this.engine.renderAndSaveFile(o);
  }

  // async runOnce() {}
  //
  // async stop() {}
}
