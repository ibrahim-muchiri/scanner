import { DeepPartial } from 'tsdef';
import { DateTime } from 'luxon';

import { ApiFixture } from '../sport/models';

export interface Schedule {
  /** List of relevant fixtures */
  fixtures: DeepPartial<ApiFixture>[];
  /** First fixture in the list */
  first: DeepPartial<ApiFixture>;
  /** Last fixture in the list */
  last: DeepPartial<ApiFixture>;
  /** Are first an last fixture the same */
  isSame: boolean;
  /** Are all fixtures beginning at the same time */
  isSingleSlot: boolean;
  /** Relevant time window of all relevant fixtures */
  slot: {
    start: DateTime;
    end: DateTime;
  };
  /** Indicates if there is at least one game currently running */
  someAreInPlay: boolean;
}
