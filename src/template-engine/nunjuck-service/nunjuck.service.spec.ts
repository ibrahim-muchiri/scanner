import { Test, TestingModule } from '@nestjs/testing';
import { NunjuckService } from './nunjuck.service';
import { NunjucksEnvironmentProvider } from '../nunjucks-environment.provider';

xdescribe('NunjuckService', () => {
  let service: NunjuckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NunjuckService, NunjucksEnvironmentProvider],
    }).compile();

    service = module.get<NunjuckService>(NunjuckService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
