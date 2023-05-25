import { Module } from '@nestjs/common';
import { NunjuckService } from './nunjuck-service/nunjuck.service';
import { NunjucksEnvironmentProvider } from './nunjucks-environment.provider';

@Module({
  exports: [NunjuckService, NunjucksEnvironmentProvider],
  providers: [NunjuckService, NunjucksEnvironmentProvider],
})
export class TemplateEngineModule {}
