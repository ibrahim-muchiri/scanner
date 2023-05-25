export interface Crawler {
  run: () => void;
  runOnce?: () => void; // Todo: not optional
  stop: () => void;
}
