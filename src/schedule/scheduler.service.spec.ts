import { Test, TestingModule } from '@nestjs/testing';
import { DeepPartial } from 'tsdef';
import { DateTime } from 'luxon';

import { SchedulerService } from './scheduler.service';
import { ApiFixture } from '../sport/models';
import { DateHelperService as DHS } from '../core/temporal/date-helper/date-helper.service';
import { Schedule } from './schedule.model';
import { ActionMode, ScheduleAction } from './schedule-action.model';

const A_vs_B: DeepPartial<ApiFixture> = {
  id: 1,
  time: {
    starting_at: DHS.createStartingTime(DateTime.fromISO('2019-08-05T08:00:00Z')),
    status: 'FT_FIN',
  },
};

const C_vs_D = {
  id: 2,
  time: {
    starting_at: DHS.createStartingTime(DateTime.fromISO('2019-08-05T08:05:00Z')),
    status: 'FT_FIN',
  },
};

const E_vs_F = {
  id: 3,
  time: {
    starting_at: DHS.createStartingTime(DateTime.fromISO('2019-08-05T09:00:00Z')),
    status: 'NS',
  },
};

const E_vs_F_LIVE = {
  id: 31,
  time: {
    starting_at: DHS.createStartingTime(DateTime.fromISO('2019-08-05T09:00:00Z')),
    status: 'LIVE',
  },
};

const G_vs_H = {
  id: 4,
  time: {
    starting_at: DHS.createStartingTime(DateTime.fromISO('2019-08-05T10:00:00Z')),
    status: 'NS',
  },
};

const G_vs_H_LIVE = {
  id: 41,
  time: {
    starting_at: DHS.createStartingTime(DateTime.fromISO('2019-08-05T10:00:00Z')),
    status: 'LIVE',
  },
};

const I_vs_J = {
  id: 5,
  time: {
    starting_at: DHS.createStartingTime(DateTime.fromISO('2019-08-05T16:00:00Z')),
    status: 'NS',
  },
};

const K_vs_L = {
  id: 6,
  time: {
    starting_at: DHS.createStartingTime(DateTime.fromISO('2019-08-05T17:35:00Z')),
    status: 'NS',
  },
};

describe('SchedulerService', () => {
  let service: SchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchedulerService],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractSchedule', () => {
    it('should work for nil values', () => {
      const sut = service.extractSchedule(null);
      expect(sut).toBeUndefined();
    });

    it('should work for empty lists', () => {
      const sut = service.extractSchedule([]);
      expect(sut).toBeUndefined();
    });

    it('should work for single elements', () => {
      const fixtures = [I_vs_J];
      const sut = service.extractSchedule(fixtures);
      const expected: Schedule = {
        fixtures: fixtures,
        first: I_vs_J,
        last: I_vs_J,
        isSame: true,
        isSingleSlot: true,
        someAreInPlay: false,
        slot: {
          start: DHS.extractStartTime(I_vs_J),
          end: DHS.extractStartTime(I_vs_J).plus({ minutes: 90 }),
        },
      };
      expect(sut).toEqual(expected);
    });

    it('should work for two elements', () => {
      const fixtures = [K_vs_L, I_vs_J];
      const sut = service.extractSchedule(fixtures);
      const expected: Schedule = {
        fixtures: [I_vs_J, K_vs_L],
        first: I_vs_J,
        last: K_vs_L,
        isSame: false,
        isSingleSlot: false,
        someAreInPlay: false,
        slot: {
          start: DHS.extractStartTime(I_vs_J),
          end: DHS.extractStartTime(K_vs_L).plus({ minutes: 90 }),
        },
      };
      expect(sut).toEqual(expected);
    });

    it('should work for multiple elements', () => {
      const fixtures = [K_vs_L, I_vs_J, A_vs_B, E_vs_F_LIVE, C_vs_D, G_vs_H_LIVE];
      const sut = service.extractSchedule(fixtures);
      const expected: Schedule = {
        fixtures: [E_vs_F_LIVE, G_vs_H_LIVE, I_vs_J, K_vs_L],
        first: E_vs_F_LIVE,
        last: K_vs_L,
        isSame: false,
        isSingleSlot: false,
        someAreInPlay: true,
        slot: {
          start: DHS.extractStartTime(E_vs_F_LIVE),
          end: DHS.extractStartTime(K_vs_L).plus({ minutes: 90 }),
        },
      };
      expect(sut).toEqual(expected);
    });
  });

  describe('processSchedule', () => {
    let fixtures: DeepPartial<ApiFixture>[];
    let schedule: Schedule;
    let sut: ScheduleAction;

    beforeEach(() => {
      fixtures = [K_vs_L, I_vs_J, A_vs_B, E_vs_F, C_vs_D, G_vs_H];
      schedule = service.extractSchedule(fixtures);
    });

    it('should work for LIVE', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T09:00:00Z'));
      expect(sut.mode).toEqual(ActionMode.LIVE);
      // ---
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T19:04:59Z'));
      expect(sut.mode).toEqual(ActionMode.LIVE);
    });

    it('should work for BEFORE_5_MIN', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T08:55:00Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_5_MIN);
      // ---
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T08:59:59Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_5_MIN);
    });

    it('should work for BEFORE_15_MIN', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T08:54:59Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_15_MIN);
      // ---
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T08:45:00Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_15_MIN);
    });

    it('should work for BEFORE_30_MIN', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T08:30:00Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_30_MIN);
      // ---
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T08:44:59Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_30_MIN);
    });

    it('should work for BEFORE_1_HOUR', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T08:00:00Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_1_HOUR);
      // ---
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T08:29:59Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_1_HOUR);
    });

    it('should work for BEFORE_4_HOUR', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T05:00:00Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_4_HOUR);
      // ---
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T07:59:59Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_4_HOUR);
    });

    it('should work for BEFORE_8_HOUR', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T01:00:00Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_8_HOUR);
      // ---
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T04:59:59Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_8_HOUR);
    });

    it('should work for BEFORE_12_HOUR', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-04T21:00:00Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_12_HOUR);
      // ---
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T00:59:59Z'));
      expect(sut.mode).toEqual(ActionMode.BEFORE_12_HOUR);
    });

    it('should work for AFTER_30_MIN', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T19:05:00Z'));
      expect(sut.mode).toEqual(ActionMode.AFTER_30_MIN);
      // ---
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T19:35:00Z'));
      expect(sut.mode).toEqual(ActionMode.AFTER_30_MIN);
    });

    it('should work for LONG_AFTER', () => {
      sut = service.processSchedule(schedule, DateTime.fromISO('2019-08-05T19:35:01Z'));
      expect(sut.mode).toEqual(ActionMode.LONG_AFTER);
    });
  });
});
