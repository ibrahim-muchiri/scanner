import { ScannerLogEntryType } from '../template-engine/template-engine.model';

export interface ScannerLog<T = any> {
  type?: ScannerLogEntryType;
  hash: string;
  id: string | number;
  data?: T;
}
