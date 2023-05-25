import { Logger } from '@nestjs/common';
import { exponentialBackOff } from './exponential-back-off.func';

export class Repeater {
  static retry(fn: () => any, attempts: number, exitOnFail = false) {
    const delay = exponentialBackOff(++attempts);
    const message = `Error --> (attempt ${attempts}). We'll try again in ${delay}ms.`;
    Logger.error(message, null, Repeater.name);
    if (exitOnFail) {
      process.exit(34);
    }
    setTimeout(fn, delay);
  }
}
