import { Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import fs from 'fs-extra';
import { crawlConfig } from '../core/config';
import { ApiContinent, ApiCountry, ApiFixture, ApiLeague, ApiSeason, ApiStanding, ApiTeam } from './models';
import { SportApi } from './sportmonks.api';

/**
 * Access to the mock DB, currently this refers to a json file system.
 * If a no local json file exists for the requested season, this is requested from SportMonks
 */
// Todo: rename to FakeApi or MockApi
export class MockSportMonksApi implements SportApi {
  private readonly logger = new Logger(MockSportMonksApi.name);
  mockDbPath: string;
  setBackSeasonId: number;
  setBackDateTime: Date | null = null;

  constructor(
    @Inject(crawlConfig.KEY)
    private readonly config: ConfigType<typeof crawlConfig>,
  ) {
    this.mockDbPath = this.config.mockDbPath;
  }

  /**
   * Set back the season to the given date
   * @param seasonId - The id of the season to set back
   * @param dateTime - The point in time to set back to
   */
  setBackSeasonToDate(seasonId: number, dateTime: Date): string {
    this.setBackSeasonId = seasonId;
    this.setBackDateTime = dateTime;

    return `Successfully set back date of season ${this.setBackSeasonId} to ${this.setBackDateTime}.`;
  }

  async fetchAllContinents(): Promise<ApiContinent[]> {
    this.logger.verbose('fetchAllContinents not implemented');
    return [];
  }

  async fetchAllPlaceholders(ids: number[]): Promise<ApiTeam[]> {
    this.logger.verbose('fetchAllPlaceholders not implemented');
    return [];
  }

  async fetchAvailableCountries(): Promise<ApiCountry[]> {
    this.logger.verbose('fetchAvailableCountries not implemented');
    return [];
  }

  async fetchAvailableLeagues(): Promise<ApiLeague[]> {
    this.logger.verbose('fetchAvailableLeagues not implemented');
    return [];
  }

  async fetchAvailableLeaguesWithCurrentSeasons(): Promise<ApiLeague[]> {
    let paths: ApiLeague[];
    try {
      paths = fs
        .readdirSync(this.mockDbPath)
        .map(Number)
        .filter(Boolean) // keep only filenames that are a number
        .map((season) => this.mockDbPath + `/${season}/${season}.json`)
        .map((path) => {
          if (fs.pathExistsSync(path)) {
            return path;
          } else {
            this.logger.warn(`File ${path} does not exists.`);
          }
        }) // cross check if paths really exist
        .map((path) => {
          const season = fs.readJsonSync(path) as ApiSeason;
          // turn season into ApiLeague
          // ToDo maybe its a little over the top but for now it works. I'm aware that there are duplicate fields in this json but we just need league.season.data.id.
          const league = {
            ...season.league.data,
            season: { data: { ...season } },
          } as ApiLeague;
          return league;
        });
    } catch (error) {
      console.log(error);
    }
    return paths;
  }

  /**
   * Fetches a season from mock db json files.
   * @param id season id, see SportMonks API
   */
  async fetchFullSeason(id: number): Promise<ApiSeason> {
    const path = `${this.mockDbPath}/${id}/${id}.json`;
    if (fs.pathExistsSync(path)) {
      try {
        const data = (await fs.readJson(path)) as ApiSeason;
        return this.manipulateSeasonJson(data);
      } catch (err) {
        console.error('Error in Season: ' + err);
        return err;
      }
    }
  }

  async fetchLive(): Promise<ApiFixture[]> {
    throw new Error('Method not implemented.');
  }

  async fetchTeamsOfSeason(id: number): Promise<ApiTeam[]> {
    const path = `${this.mockDbPath}/${id}/teams.json`;

    if (fs.pathExistsSync(path)) {
      try {
        return (await fs.readJson(path)) as ApiTeam[];
      } catch (err) {
        console.error('Error in TeamsOfSeason: ' + err);
        return err;
      }
    }
  }

  /**
   * This function manipulates a season json object. It sets the json object back to the date set by setBackSeasonToDate(). If no date exists, returns the initial object.
   * @param season
   * @returns
   */
  private manipulateSeasonJson(season: ApiSeason): ApiSeason {
    if (season.id === this.setBackSeasonId && this.setBackDateTime) {
      // set back this data object to the given date and time
      // ToDo: to , from this time. Means to this time: excluding the game cicked, from this time: including the game (default)
      const fixtures = season.fixtures.data;
      const newSeasonDateTime = this.setBackDateTime;
      season.fixtures.data = fixtures.map((fixture) => {
        const fixtureDateTime = new Date(fixture.time.starting_at.date_time);
        // set back all fixtures where the date/time is after the set date/time
        // this includes a game that started at the set date/time
        if (fixtureDateTime > newSeasonDateTime) {
          console.log(fixtureDateTime, newSeasonDateTime);
          fixture.winner_team_id = null;
          fixture.winning_odds_calculated = false;
          fixture.scores = {
            localteam_score: 0,
            visitorteam_score: 0,
            localteam_pen_score: null,
            visitorteam_pen_score: null,
            ht_score: null,
            ft_score: null,
            et_score: null,
            ps_score: null,
          };
          fixture.time.status = 'NS';
          fixture.time.minute = null;
        }
        return fixture;
      });
      return season;
    }
    // if no match return the mock data
    return season;
  }

  async fetchSeasonStandings(id: number): Promise<ApiStanding[]> {
    const path = `${this.mockDbPath}/${id}/standing.json`;

    if (fs.pathExistsSync(path)) {
      try {
        return (await fs.readJson(path)) as ApiStanding[];
      } catch (err) {
        console.error('Error in fetching standings: ' + err);
        return err;
      }
    }
  }
}
