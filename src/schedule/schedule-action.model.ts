export enum ActionMode {
  LIVE,
  BEFORE_5_MIN,
  BEFORE_15_MIN,
  BEFORE_30_MIN,
  BEFORE_1_HOUR,
  BEFORE_4_HOUR,
  BEFORE_8_HOUR,
  BEFORE_12_HOUR,
  LONG_BEFORE,
  AFTER_30_MIN,
  LONG_AFTER,
}

export interface ScheduleAction {
  mode: ActionMode;
  timeout: number;
}
