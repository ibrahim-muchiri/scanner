import omit from 'lodash/omit';
import { ApiFixture, ApiSeason } from './models';
import { Injectable } from '@nestjs/common';

export type CleanedSeason = ApiSeason & {
  fixtures?: { data: CleanedFixtures };
};

export type CleanedFixtures = Omit<
  ApiFixture,
  | 'assistants'
  | 'attendance'
  | 'coaches'
  | 'colors'
  | 'commentaries'
  | 'details'
  | 'formations'
  | 'neutral_venue'
  | 'pitch'
  | 'referee_id'
  | 'standings'
  | 'venue_id'
  | 'weather_report'
>[];

@Injectable()
export class SeasonCleaner {
  /**
   * Remove useless information from season to not pollute the hash algorithm.
   */
  cleanFixturesOfSeason(season: ApiSeason): CleanedSeason {
    if (season && season.fixtures) {
      const cleaned = {
        fixtures: { data: this.cleanUpFixture(season.fixtures.data) },
      };
      return Object.assign({}, season, cleaned);
    }
    return season;
  }

  /**
   * Remove useless information from fixtures to not pollute the hash algorithm.
   */
  private cleanUpFixture(data: ApiFixture[]): CleanedFixtures {
    const list = [];
    for (const e of data) {
      list.push(
        omit(e, [
          'assistants',
          'attendance',
          'coaches',
          'colors',
          'commentaries',
          'details',
          'formations',
          'neutral_venue',
          'pitch',
          'referee_id',
          'standings',
          'venue_id',
          'weather_report',
        ]),
      );
    }
    return list;
  }
}
