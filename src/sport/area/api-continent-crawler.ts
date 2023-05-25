import { Inject, Injectable } from '@nestjs/common';
import { ApiContinent, SportMonksResponse } from '../models';
import { TemplateOptions } from '../../template-engine/template-engine.model';
import { NunjuckService } from '../../template-engine/nunjuck-service/nunjuck.service';
import { AxiosInstance } from 'axios';

@Injectable()
export class ApiContinentCrawler {
  constructor(private engine: NunjuckService, @Inject('AXIOS') private axiosInstance: AxiosInstance) {}

  async runAll() {
    const res = await this.axiosInstance.get<SportMonksResponse<ApiContinent[]>>('/continents');
    const data = res.data.data.filter((e) => e.name);
    const o: TemplateOptions<ApiContinent[]> = {
      templateFilename: 'continents.njk',
      outputFilename: './dist/api/continents.data.sql',
      data,
    };

    await this.engine.renderAndSaveFile(o);
  }
}
