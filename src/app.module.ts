import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { axiosConfig, databaseConfig, crawlConfig } from './core/config';
import { commonConfig } from './core/config/common-config';
import { CoreModule } from './core/core.module';
import { DbMockModule } from './db-mock/db-mock.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ApiContinentCrawler } from './sport/competition/api-continent.crawler';
import { ApiCountryCrawler } from './sport/competition/api-country.crawler';
import { ApiCurrentSeasonsCrawler } from './sport/competition/api-current-seasons.crawler';
import { ApiLeagueCrawler } from './sport/competition/api-league.crawler';
import { ApiPlaceholderCrawler } from './sport/competition/api-placeholder.crawler';
import { ApiStandingCrawler } from './sport/competition/api-standing-crawler';
import { SportModule } from './sport/sport.module';
import { TemplateEngineModule } from './template-engine/template-engine.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [commonConfig, databaseConfig, crawlConfig, axiosConfig],
      expandVariables: true,
      envFilePath: '.env',
    }),
    CoreModule,
    TemplateEngineModule,
    ScheduleModule,
    SportModule,
    DbMockModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ApiPlaceholderCrawler,
    ApiCurrentSeasonsCrawler,
    ApiLeagueCrawler,
    ApiStandingCrawler,
    ApiCountryCrawler,
    ApiContinentCrawler,
  ], // Todo: ApiScannerLive!
  // providers: [ApiTeamCrawler, ApiSeasonCrawler]
})
export class AppModule {}
