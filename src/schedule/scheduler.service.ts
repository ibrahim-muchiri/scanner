import { Injectable } from '@nestjs/common';
import { DateTime, Interval } from 'luxon';
import { DeepPartial } from 'tsdef';

import { ApiFixture } from '../sport/models';
import { transformStatusComplete } from '../template-engine/sport-monks-transformers';
import { DateHelperService as DHS } from '../core/temporal/date-helper/date-helper.service';
import { DEFAULT_TIMEOUT_TABLE, TimeoutTable } from './timeout-table.model';
import { ActionMode, ScheduleAction } from './schedule-action.model';
import { Schedule } from './schedule.model';

@Injectable()
export class SchedulerService {
  currentSchedule: Schedule;
  timeoutTable: TimeoutTable;

  constructor() {
    this.timeoutTable = DEFAULT_TIMEOUT_TABLE;
  }

  setTimeoutTable(table: TimeoutTable): ScheduleAction {
    this.timeoutTable = table;
    return this.processSchedule();
  }

  extractSchedule(fixtures: DeepPartial<ApiFixture>[]): Schedule {
    if (!fixtures) {
      return;
    }
    const relevantFixtures = fixtures.filter((e) => {
      const status = transformStatusComplete(e.time.status);
      return status === 'NOT_FIN' || status === 'IN_PLAY';
    });
    const liveFixtures = fixtures.filter((e) => transformStatusComplete(e.time.status) === 'IN_PLAY');
    if (relevantFixtures.length > 0) {
      relevantFixtures.sort((a, b) => +DHS.extractStartTime(a) - +DHS.extractStartTime(b));
      const first = relevantFixtures[0];
      const last = relevantFixtures[relevantFixtures.length - 1];
      this.currentSchedule = {
        fixtures: relevantFixtures,
        first,
        last,
        isSame: first === last,
        isSingleSlot: first.time.starting_at.date_time === last.time.starting_at.date_time,
        slot: {
          start: DateTime.fromSQL(first.time.starting_at.date_time, {
            zone: first.time.starting_at.timezone,
          }),
          end: DateTime.fromSQL(last.time.starting_at.date_time, {
            zone: last.time.starting_at.timezone,
          }).plus({ minutes: 90 }),
        },
        someAreInPlay: liveFixtures.length > 0,
      };
    }
    return this.currentSchedule;
  }

  processSchedule(schedule?: Schedule, now = DateTime.utc()): ScheduleAction {
    if (!schedule) {
      schedule = this.currentSchedule;
    }
    if (!schedule) {
      return {
        mode: ActionMode.LONG_AFTER,
        timeout: this.getTimeout(ActionMode.LONG_AFTER),
      };
    }
    const interval = Interval.fromDateTimes(schedule.slot.start, schedule.slot.end);

    // this is easy, when games are running use "live" mode
    if (schedule.someAreInPlay) {
      return {
        mode: ActionMode.LIVE,
        timeout: this.getTimeout(ActionMode.LIVE),
      };
    }

    // else, look at the interval and compare it to "now"
    if (interval.isAfter(now)) {
      // "now" is before the time window
      const duration = schedule.slot.start.diff(now);
      const minutes = duration.as('minutes');
      let mode: ActionMode;
      if (minutes <= 5) {
        mode = ActionMode.BEFORE_5_MIN;
      } else if (minutes <= 15) {
        mode = ActionMode.BEFORE_15_MIN;
      } else if (minutes <= 30) {
        mode = ActionMode.BEFORE_30_MIN;
      } else if (minutes <= 60) {
        mode = ActionMode.BEFORE_1_HOUR;
      } else if (minutes <= 240) {
        mode = ActionMode.BEFORE_4_HOUR;
      } else if (minutes <= 480) {
        mode = ActionMode.BEFORE_8_HOUR;
      } else if (minutes <= 720) {
        mode = ActionMode.BEFORE_12_HOUR;
      } else {
        mode = ActionMode.LONG_BEFORE;
      }
      return {
        mode,
        timeout: this.getTimeout(mode),
      };
    }
    if (interval.contains(now)) {
      // "now" is in the relevant time window but no games are currently running
      // this is only possible (here: reachable), if some fixtures are not updated correctly by the API
      return {
        mode: ActionMode.LIVE,
        timeout: this.getTimeout(ActionMode.LIVE),
      };
    }
    if (interval.isBefore(now)) {
      // "now" is after the time window
      const duration = now.diff(schedule.slot.end);
      const minutes = duration.as('minutes');
      let mode: ActionMode;
      if (minutes <= 30) {
        mode = ActionMode.AFTER_30_MIN;
      } else {
        mode = ActionMode.LONG_AFTER;
      }
      return {
        mode: mode,
        timeout: this.getTimeout(mode),
      };
    }
  }

  getTimeout(mode: ActionMode) {
    switch (mode) {
      case ActionMode.LIVE:
        return this.timeoutTable.LIVE_TIMEOUT;
      case ActionMode.BEFORE_5_MIN:
        return this.timeoutTable.MIN_5_TIMEOUT;
      case ActionMode.BEFORE_15_MIN:
        return this.timeoutTable.MIN_15_TIMEOUT;
      case ActionMode.BEFORE_30_MIN:
        return this.timeoutTable.MIN_30_TIMEOUT;
      case ActionMode.BEFORE_1_HOUR:
        return this.timeoutTable.HOUR_1_TIMEOUT;
      case ActionMode.BEFORE_4_HOUR:
        return this.timeoutTable.HOUR_4_TIMEOUT;
      case ActionMode.BEFORE_8_HOUR:
        return this.timeoutTable.HOUR_8_TIMEOUT;
      case ActionMode.BEFORE_12_HOUR:
        return this.timeoutTable.HOUR_12_TIMEOUT;
      case ActionMode.LONG_BEFORE:
        return this.timeoutTable.LONG_BEFORE_TIMEOUT;
      case ActionMode.LONG_AFTER:
        return this.timeoutTable.LONG_AFTER_TIMEOUT;
      default:
        return this.timeoutTable.DEFAULT_TIMEOUT;
    }
  }
}
