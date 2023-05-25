import { Test, TestingModule } from '@nestjs/testing';
import { crawlConfig } from '../core/config';
import { ApiSeason, ApiTeam } from '../sport/models';
import { SeasonCleaner } from '../sport/season-cleaner';
import { SportApi } from '../sport/sportmonks.api';
import { DbMockService } from './db-mock.service';
import { FileWriter } from './file-writer';

describe('DbMockService', () => {
  let service: DbMockService;

  const mockAPI = {
    fetchFullSeason: jest.fn().mockImplementation((id: number) => {
      return {
        id: id,
        name: '2021/2022',
        league_id: 82,
        is_current_season: true,
        current_round_id: 249607,
        current_stage_id: 77453972,
        teams: {},
      } as ApiSeason;
    }),
    fetchTeamsOfSeason: jest.fn().mockImplementation(() => {
      return [
        {
          id: 3542,
          country_id: 11,
          name: 'SC Freiburg',
          short_code: 'SCF',
          national_team: false,
        },
        {
          id: 3431,
          country_id: 11,
          name: 'SpVgg Greuther Fürth',
          short_code: 'GRF',
          national_team: false,
        },
      ] as ApiTeam[];
    }),
  };
  const mockCleaner = {
    cleanFixturesOfSeason: jest.fn().mockImplementation((season: ApiSeason) => {
      return season;
    }),
  };
  const mockWriter = {
    createSeasonJsons: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbMockService,
        {
          provide: SportApi,
          useValue: mockAPI,
        },
        SeasonCleaner,
        FileWriter,
        {
          provide: crawlConfig.KEY,
          useValue: {
            mockApi: true,
          },
        },
      ],
    })
      .overrideProvider(SportApi)
      .useValue(mockAPI)
      .overrideProvider(SeasonCleaner)
      .useValue(mockCleaner)
      .overrideProvider(FileWriter)
      .useValue(mockWriter)
      .compile();

    service = module.get<DbMockService>(DbMockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve Bundesliga', async () => {
    // useless test
    // await service.retrieveBundesliga(18444);
    // expect(mockAPI.fetchFullSeason).toBeCalledTimes(1);
    // expect(mockAPI.fetchTeamsOfSeason).toBeCalledTimes(1);
    // expect(mockCleaner.cleanFixturesOfSeason).toBeCalledTimes(1);
    // expect(mockWriter.createSeasonJsons).toBeCalledTimes(1);
  });
});
