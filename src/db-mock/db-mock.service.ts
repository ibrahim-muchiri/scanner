import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { crawlConfig } from '../core/config';
import { ApiFixture, ApiLeague, ApiSeason, ApiTeam } from '../sport/models';
import { SeasonCleaner } from '../sport/season-cleaner';
import { SportApi } from '../sport/sportmonks.api';
import { FileWriter } from './file-writer';
import { FixtureCleaned } from './models/fixture-cleaned.model';

@Injectable()
export class DbMockService {
  private readonly logger = new Logger(DbMockService.name);

  constructor(
    @Inject(crawlConfig.KEY)
    private readonly config: ConfigType<typeof crawlConfig>,
    private api: SportApi,
    private cleaner: SeasonCleaner,
    private writer: FileWriter,
  ) {}

  /**
   * Get all data for specific Bundesliga Season from SportMonks and create a json file
   * @param leagueID see Sportmonks
   * @returns Complete Season with Teams and Fixtures
   */
  async retrieveBundesliga(leagueID: number): Promise<string> {
    let season: ApiSeason;
    let teams: ApiTeam[];

    this.logger.log(`Start scanning season with ID: ${leagueID}`);

    try {
      season = await this.api.fetchFullSeason(leagueID);
      if (!season) {
        const msg = this.config.mockApi
          ? 'Could not fetch Season data. You use the fake API and probably no json file exists.'
          : 'Something went wrong!';
        throw new Error(msg);
      }
      teams = await this.api.fetchTeamsOfSeason(season.id);
    } catch (error) {
      this.logger.error(`${error.message} --> ${error.config?.url}`, error.stack);
      return error.message;
    }

    const cleanedSeason = this.cleaner.cleanFixturesOfSeason(season);

    if (cleanedSeason.teams) {
      cleanedSeason.teams.data = teams;
      this.logger.log(`Scanning successfull, ID ${leagueID}`);
    } else {
      throw new Error('TypeError: cannot write data to undefined');
    }

    if (process.env.MODE === 'dev') {
      return `Read data of season ${cleanedSeason.league.data.name} year ${cleanedSeason.name} successfully.`;
    } else {
      const response =
        'Json files for raw season data and teams succesfully created in folder: ' +
        this.writer.createSeasonJsons(cleanedSeason, teams);
      return response;
    }
  }

  /**
   * This function loads a json file and manipulates it to a given date. Careful! This only works in dev mode!
   * @param seasonId the season id of the requested Season
   * @param date_time the date and time of the game
   * @param includeGame to include the game or exclude it from search
   */
  async setBackSeason(seasonId: number, date_time: string, includeGame: boolean): Promise<string> {
    if (this.config.mockApi) {
      let res: string;
      const date = new Date(date_time);
      if (includeGame) {
        const newDate = new Date(date.setTime(date.getTime() - 1000 * 60));
        res = this.api.setBackSeasonToDate(seasonId, newDate);
      } else {
        res = this.api.setBackSeasonToDate(seasonId, date);
      }
      return res;
    }
    return `System is running with mockApi ${this.config.mockApi}, setBackSeason() is only available in fake API mode!`;
  }

  getAvailableLeagues(): Promise<ApiLeague[]> {
    return this.api.fetchAvailableLeaguesWithCurrentSeasons();
  }

  /**
   * Transforms fixture data for html view. Only converts current needed ids to real names.
   * @param fixtures
   * @param teams
   * @returns
   */
  transformFixtureData(fixtures: ApiFixture[], teams: ApiTeam[]): FixtureCleaned[] {
    const cleanedFixtures = fixtures
      .map((fixture) => {
        const local = teams.find((team) => team.id === fixture.localteam_id);
        const visitor = teams.find((team) => team.id === fixture.visitorteam_id);
        const localScore = fixture.scores.localteam_score;
        const visitorScore = fixture.scores.visitorteam_score;

        const cleaned: FixtureCleaned = {
          id: fixture.id,
          date_time: fixture.time.starting_at.date_time,
          local_team: local?.name,
          visiting_team: visitor?.name,
          local_team_score: localScore,
          visiting_team_score: visitorScore,
        };
        return cleaned;
      })
      .sort((a, b) => (a.date_time > b.date_time ? 1 : -1));

    return cleanedFixtures;
  }
}
