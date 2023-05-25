import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { ApiFixture, ApiFixtureStartingAt } from '../../../sport/models';
import { DeepPartial } from 'tsdef';

@Injectable()
export class DateHelperService {
  static createStartingTime(date: DateTime): ApiFixtureStartingAt {
    if (!date) {
      date = DateHelperService.createRandomDate();
    }
    return {
      date_time: date.toSQL(),
      date: date.toSQLDate(),
      time: date.toSQLTime(),
      timestamp: date.toMillis(),
      timezone: 'UTC',
    };
  }

  static createRandomDate(
    after: DateTime = DateTime.fromISO('2017-08-05T08:44:27Z'),
    before: DateTime = DateTime.fromISO('2025-08-05T08:44:27Z'),
  ) {
    return DateTime.fromMillis(after.toMillis() + Math.random() * (before.toMillis() - after.toMillis()));
  }

  static extractStartTime(fixture: DeepPartial<ApiFixture>): DateTime {
    return DateTime.fromSQL(fixture.time.starting_at.date_time, {
      zone: fixture.time.starting_at.timezone,
    });
  }
}
