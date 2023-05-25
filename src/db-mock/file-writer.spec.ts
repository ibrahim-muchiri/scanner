import { Test, TestingModule } from '@nestjs/testing';
import fs from 'fs-extra';
import { ApiSeason, ApiTeam } from 'src/sport/models';
import { crawlConfig } from '../core/config';
import { FileWriter } from './file-writer';

jest.mock('fs-extra', () => {
  return {
    outputJSON: jest.fn().mockImplementation(() => {
      return {
        then: jest.fn().mockImplementation(() => {
          return {
            catch: jest.fn(),
          };
        }),
      };
    }),
  };
});

describe('FileWriter', () => {
  const season = {
    id: 18444,
    name: '2021/2022',
    league_id: 82,
    is_current_season: true,
    current_round_id: 249607,
    current_stage_id: 77453972,
    league: {
      data: {
        id: 82,
        active: true,
        type: 'domestic',
        legacy_id: 4,
        country_id: 11,
        logo_path: 'https://cdn.sportmonks.com/images/soccer/leagues/82.png',
        name: 'Bundesliga',
        is_cup: false,
        is_friendly: false,
        current_season_id: 18444,
        current_round_id: 249607,
        current_stage_id: 77453972,
        live_standings: true,
        coverage: {
          predictions: true,
          topscorer_goals: true,
          topscorer_assists: true,
          topscorer_cards: true,
        },
      },
    },
    teams: { data: [] },
  } as ApiSeason;

  const teams = [
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

  let sut: FileWriter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileWriter,
        {
          provide: crawlConfig.KEY,
          useValue: {
            mockDbPath: './generated-mock',
          },
        },
      ],
    }).compile();

    sut = module.get<FileWriter>(FileWriter);
  });

  it('should not create JSON', () => {
    sut.createSeasonJsons(undefined, teams);
    expect(fs.outputJSON).toHaveBeenCalledTimes(0);
  });

  it('should create JSON', () => {
    sut.createSeasonJsons(season, teams);
    expect(fs.outputJSON).toHaveBeenCalledTimes(2);
    expect(fs.outputJSON).toHaveBeenNthCalledWith(1, './generated-mock/18444/18444.json', season, expect.anything());
    expect(fs.outputJSON).toHaveBeenNthCalledWith(2, './generated-mock/18444/teams.json', teams, expect.anything());
  });
});
