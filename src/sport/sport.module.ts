import { Module } from '@nestjs/common';
import { FactoryProvider } from '@nestjs/common/interfaces';
import { ConfigType } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { crawlConfig } from '../core/config';
import { CoreModule } from '../core/core.module';
import { AXIOS_TOKEN } from '../core/network/axios.provider';
import { TemplateEngineModule } from '../template-engine/template-engine.module';
import { BettlesApi } from './bettles.api';
import { MockSportMonksApi } from './mock-sportmonks.api';
import { ScannerApi } from './scanner.api';
import { SeasonCleaner } from './season-cleaner';
import { SportApi, SportmonksApi } from './sportmonks.api';

export const SportDataProvider: FactoryProvider<SportApi> = {
  provide: SportApi,
  useFactory: (config: ConfigType<typeof crawlConfig>, axios: AxiosInstance) =>
    config.mockApi ? new MockSportMonksApi(config) : new SportmonksApi(axios),
  inject: [crawlConfig.KEY, AXIOS_TOKEN],
};

@Module({
  imports: [CoreModule, TemplateEngineModule],
  exports: [SeasonCleaner, SportDataProvider, BettlesApi, ScannerApi],
  providers: [SeasonCleaner, SportDataProvider, BettlesApi, ScannerApi],
})
export class SportModule {}
