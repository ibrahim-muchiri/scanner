export interface TemplateOptions<T = any> {
  templateFilename: string;
  outputFilename: string;
  data?: T;
  meta?: ScannerLogEntry;
}

export type ScannerLogEntryType = 'ALL_COUNTRIES' | 'ALL_LEAGUES' | 'LEAGUE' | 'SEASON' | 'LIVE' | 'STANDINGS';

export interface ScannerLogEntry {
  type: ScannerLogEntryType;
  hash: string;
  id?: string;
  log?: string;
  json?: string;
  isSameAsPrevious?: boolean;
}
