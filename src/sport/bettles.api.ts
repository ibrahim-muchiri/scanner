import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Pool } from 'pg';
import { HashService } from '../core/hash/hash.service';
import { crawlConfig } from '../core/config';
import { Repeater } from '../core/network/repeater.class';
import { POOL_TOKEN } from '../core/db/pool.provider';
import { NunjuckService } from '../template-engine/nunjuck-service/nunjuck.service';
import { ApiContinent, ApiCountry, ApiFixture, ApiLeague, ApiStanding, ApiStandingEntry, ApiTeam } from './models';
import { ScannerApi } from './scanner.api';
import { CleanedSeason } from './season-cleaner';
import { randomUUID } from 'crypto';

export const MAX_ATTEMPTS = 10;

@Injectable()
export class BettlesApi {
  private static VERSION = '0.4.0'; // Todo: use commit hash somehow
  private readonly logger = new Logger(BettlesApi.name);

  constructor(
    @Inject(POOL_TOKEN) private pool: Pool,
    @Inject(crawlConfig.KEY)
    private readonly config: ConfigType<typeof crawlConfig>,
    private engine: NunjuckService,
    private hasher: HashService,
    private scanner: ScannerApi,
  ) {}

  async updateContinents(list: ApiContinent[], attempts = 0) {
    if (Array.isArray(list) && list.length < 1) {
      this.logger.verbose(`Nothing to do. List of continents is empty...`);
      return;
    }
    const context = {
      outputFilename: `./generated-sql/api/update-continents.data.sql`,
      templateFilename: 'continents.njk',
      data: list,
    };
    const sql = this.engine.render(context, this.config.persistSql);
    return this.save(sql, `placeholder continents`);
  }

  /**
   * Update the country data from our API provider to our own system.
   *
   * @param countries - All countries to update.
   * @param attempts - The number of retries.
   */
  async updateCountries(countries: ApiCountry[], attempts = 0) {
    this.logger.verbose(`Updating countries...`);

    // first, retrieve the last updated hashes
    await this.scanner.fetchCurrentHashesFromDatabase();

    // to check if there is something to do at all
    const logEntry = this.scanner.createLogEntry('ALL_COUNTRIES', countries, 'all-countries');
    if (logEntry.isSameAsPrevious) {
      this.logger.verbose(`Nothing to do. Countries have not changed!`);
      return;
    }

    // ok, prepare context for rendering sql template engine
    const context = {
      outputFilename: `./generated-sql/api/update-countries.data.sql`, // for debugging
      templateFilename: 'countries.njk',
      data: countries,
      meta: logEntry,
    };

    // render sql (for season and scanner log)
    const sql = this.engine.render(context, this.config.persistSql);

    // and push it to database
    return this.save(sql, `countries`);
  }

  /**
   * Update the leagues data from our API provider to our own system.
   *
   * @param leagues - All leagues to update.
   * @param attempts - The number of retries.
   */
  async updateLeagues(leagues: ApiLeague[], attempts = 0) {
    this.logger.verbose(`Updating leagues...`);

    // first, retrieve the last updated hashes
    await this.scanner.fetchCurrentHashesFromDatabase();

    // to check if there is something to do at all
    const logEntry = this.scanner.createLogEntry('ALL_LEAGUES', leagues, 'all-leagues');
    // if (logEntry.isSameAsPrevious) {
    //   this.logger.verbose(`Nothing to do. Leagues have not changed!`);
    //   return;
    // }

    // ok, prepare context for rendering sql template engine
    const context = {
      outputFilename: `./generated-sql/api/update-leagues.data.sql`, // for debugging
      templateFilename: 'upsert-leagues.njk',
      data: leagues,
      meta: logEntry,
    };

    // render sql (for season and scanner log)
    const sql = this.engine.render(context, this.config.persistSql);

    // and push it to database
    return this.save(sql, `leagues`);
  }

  async updateLeagueOfSeason(season: CleanedSeason, attempts = 0) {
    const context = {
      // outputFilename: `./generated-sql/api/update-league-${season.league.data.id}.data.sql`, // for debugging
      outputFilename: `./generated-sql/api/season-${season.id}/season-${season.id}-current-season.data.sql`,
      templateFilename: 'upsert-league.njk',
      data: season, //.league.data, this broke if the current_season_id is not the crawled season
    };
    const sql = this.engine.render(context, this.config.persistSql);
    return this.save(sql, `league with current season`);
  }

  async updateTeamsOfSeason(season: CleanedSeason, attempts = 0) {
    const data = season.teams?.data;
    if (Array.isArray(data) && data.length < 1) {
      this.logger.verbose(`Nothing to do. List of teams (season: ${season.id}) is empty...`);
      return;
    }
    const context = {
      outputFilename: `./generated-sql/api/season-${season.id}/season-${season.id}-teams.data.sql`,
      templateFilename: 'team.njk',
      data,
    };
    const sql = this.engine.render(context, this.config.persistSql);
    return this.save(sql, `teams (season: ${season.id})`);
  }

  async updateStagesOfSeason(season: CleanedSeason, attempts = 0) {
    const data = season.stages?.data;
    if (Array.isArray(data) && data.length < 1) {
      this.logger.verbose(`Nothing to do. List of stages (season: ${season.id}) is empty...`);
      return;
    }
    const context = {
      outputFilename: `./generated-sql/api/season-${season.id}/season-${season.id}-stages.data.sql`,
      templateFilename: 'stage.njk',
      data,
    };
    const sql = this.engine.render(context, this.config.persistSql);
    return this.save(sql, `stages (season: ${season.id})`);
  }

  async updateRoundsOfSeason(season: CleanedSeason, attempts = 0) {
    const data = season.rounds?.data;
    if (Array.isArray(data) && data.length < 1) {
      this.logger.verbose(`Nothing to do. List of rounds (season: ${season.id}) is empty...`);
      return;
    }
    const context = {
      outputFilename: `./generated-sql/api/season-${season.id}/season-${season.id}-rounds.data.sql`,
      templateFilename: 'round.njk',
      data,
    };
    const sql = this.engine.render(context, this.config.persistSql);
    return this.save(sql, `rounds (season: ${season.id})`);
  }

  async updateGroupsOfSeason(season: CleanedSeason, attempts = 0) {
    const data = season.groups?.data;
    if (Array.isArray(data) && data.length < 1) {
      this.logger.verbose(`Nothing to do. List of groups (season: ${season.id}) is empty...`);
      return;
    }
    const context = {
      outputFilename: `./generated-sql/api/season-${season.id}/season-${season.id}-groups.data.sql`,
      templateFilename: 'group.njk',
      data,
    };
    const sql = this.engine.render(context, this.config.persistSql);
    return this.save(sql, `groups (season: ${season.id})`);
  }

  async updateFixturesOfSeason(season: CleanedSeason, attempts = 0) {
    const data = season.fixtures?.data;
    if (Array.isArray(data) && data.length < 1) {
      this.logger.verbose(`Nothing to do. List of fixture (season: ${season.id}) is empty...`);
      return;
    }
    const context = {
      outputFilename: `./generated-sql/api/season-${season.id}/season-${season.id}-fixtures.data.sql`,
      templateFilename: 'fixture.njk',
      data,
    };
    const sql = this.engine.render(context, this.config.persistSql);
    return this.save(sql, `fixtures (season: ${season.id})`);
  }

  async updateTeams(teams: ApiTeam[], attempts = 0) {
    if (Array.isArray(teams) && teams.length < 1) {
      this.logger.verbose(`Nothing to do. List of teams is empty...`);
      return;
    }
    const context = {
      outputFilename: `./generated-sql/api/update-placeholder-teams.data.sql`,
      templateFilename: 'team.njk',
      data: teams,
    };
    const sql = this.engine.render(context, this.config.persistSql);
    return this.save(sql, `placeholder teams`);
  }

  /**
   * Update the relevant sports data from our API provider to our own system.
   *
   * @param season - The cleaned season to update.
   * @param attempts - The number of retries.
   * @private
   */
  async updateSeason(season: CleanedSeason, attempts = 0) {
    this.logger.verbose(`Updating season ${season.id}...`);

    // first, retrieve the last updated hashes
    await this.scanner.fetchCurrentHashesFromDatabase();

    // check if there is something to do at all
    const logEntry = this.scanner.createLogEntry('SEASON', season, season.id?.toString(10));
    if (logEntry.isSameAsPrevious) {
      this.logger.verbose(`Nothing to do. Season (${season.id}) has not changed!`);
      return;
    }

    // prepare context for rendering sql template
    const context = {
      outputFilename: `./generated-sql/api/season-${season.id}/season-${season.id}-base.data.sql`,
      templateFilename: 'update-season.njk',
      data: { season: [season], fixtures: season.fixtures.data },
      meta: logEntry,
    };

    // render sql (for season and scanner log)
    const sql = this.engine.render(context, this.config.persistSql);

    // and push it to database
    return this.save(sql, `season ${season.id}`);
  }

  /**
   * Crawl season standings with rounds by season ID
   * @param standing
   */
  async updateLeagueStandings(standing: ApiStanding[]) {
    if (Array.isArray(standing) && standing.length) {
      const seasonId = Number(standing[0].season_id);
      this.logger.verbose(`Updating season standings for season ${seasonId}...`);

      // first, retrieve the last updated hashes
      await this.scanner.fetchCurrentHashesFromDatabase();

      // check if there is something to do at all
      const logEntry = this.scanner.createLogEntry('STANDINGS', standing, seasonId?.toString(10));
      if (logEntry.isSameAsPrevious) {
        this.logger.verbose(`Nothing to do. Standings for season (${seasonId}) has not changed!`);
        return;
      }

      // flatten standing entries
      const standingEntries: ApiStandingEntry[] = [];
      standing.forEach((stage) => {
        // thats the group in a cup
        // or rounds in leagues with playoffs
        // for BL its just an array with length 1
        stage.standings.data.forEach((team) => {
          // thats the position of each team
          if (team.standings) {
            team.standings.data.forEach((elem) => {
              standingEntries.push(elem);
            });
          } else {
            standingEntries.push(team);
          }
        });
      });

      // prepare context for rendering sql template
      const context = {
        outputFilename: `./generated-sql/api/season-${seasonId}/season-${seasonId}-standings.data.sql`,
        templateFilename: 'standing.njk',
        data: {
          season_id: seasonId,
          standing_entries: standingEntries,
        },
        meta: logEntry,
      };

      // render sql (for season and scanner log)
      const sql = this.engine.render(context, this.config.persistSql);

      // and push it to database
      return this.save(sql, `standings (season ${seasonId})`);
    }
  }

  async updateLiveFixtures(fixtures: ApiFixture[], attempts = 0) {
    this.logger.verbose(`Updating live fixtures...`);

    // first, retrieve the last updated hashes
    await this.scanner.fetchCurrentHashesFromDatabase();

    let sql = ' -- Auto generated';
    for (const fixture of fixtures) {
      sql += (await this.fixtureToSql(fixture)) + '\n';
      // Todo: Mmmhh
      // this.save(sql, `fixture: ${fixture.id}`); // ? .catch(reason => this.logger.error(reason));
    }

    // Todo: Where to save? Here or in loop?
    return this.save(sql, `live fixtures`); //.catch(reason => this.logger.error(reason));
  }

  async fixtureToSql(fixture: ApiFixture, attempts = 0) {
    // check if there is something to do at all
    const logEntry = this.scanner.createLogEntry('LIVE', fixture, fixture.id.toString(10));
    if (logEntry.isSameAsPrevious) {
      this.logger.verbose(`Nothing to do. Fixture (${fixture.id}) has not changed!`);
      return;
    }

    // prepare context for rendering sql template
    const context = {
      outputFilename: `./generated-sql/api/update-season-${fixture.id}.data.sql`, // for debugging
      templateFilename: 'upsert-fixture.njk',
      data: fixture,
      meta: logEntry,
    };

    // render sql (for season and scanner log)
    return this.engine.render(context);
  }

  private async save(sql: string, log: string, attempts = 0) {
    if (!sql) {
      this.logger.verbose(`Nothing to save. Query is empty.`);
      return;
    }

    if (!this.config.persistToDb) {
      return Promise.resolve();
    }

    // console.log(sql);
    // and push it to database
    const client = await this.pool.connect();
    try {
      await client.query(sql);
      this.logger.verbose(`Successfully updated ${log}`);
    } catch (err) {
      this.logger.error(`An error occurred: ${err} while processing ${log}. Retrying...`);
      if (attempts < MAX_ATTEMPTS) {
        Repeater.retry(this.save.bind(this, sql, log, ++attempts), attempts);
      } else {
        this.logger.warn(`MAX_ATTEMPTS (${MAX_ATTEMPTS}) reached. Aborted ${log}`);
      }
    } finally {
      client.release();
    }
  }
}
