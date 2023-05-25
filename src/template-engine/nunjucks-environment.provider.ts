import nunjucks from 'nunjucks';
import { Logger } from '@nestjs/common';
import { FactoryProvider } from '@nestjs/common/interfaces';
import * as path from 'path';

import {
  extractAway,
  extractHome,
  transformLeagueType,
  transformStageType,
  transformStatus,
} from './sport-monks-transformers';

function createNunjucks() {
  let templateFolder: string;
  if (process.env.NODE_ENV === 'development') {
    templateFolder = './dist/template-engine/templates';
  } else {
    templateFolder = path.join(__dirname, 'templates');
  }
  const env: nunjucks.Environment = nunjucks.configure(templateFolder, {
    autoescape: false,
  });
  env.addGlobal('now', function () {
    return new Date().toISOString();
  });
  env.addFilter('esc', function (str) {
    return str.replace(`'`, `''`);
  });
  env.addFilter('status', transformStatus);
  env.addFilter('stageType', transformStageType);
  env.addFilter('leagueType', transformLeagueType);
  env.addFilter('home', extractHome);
  env.addFilter('away', extractAway);
  env.addFilter('ifNil', function (item: any, defaults: any = 'NULL') {
    return item === undefined || item === null ? defaults : item;
  });
  Logger.log('Nunjucks environment created', 'Nunjucks');
  Logger.log(`Using template files from ${templateFolder}`, 'Nunjucks');
  return env;
}

export const NUNJUCKS_TOKEN = 'NUNJUCKS';

export const NunjucksEnvironmentProvider: FactoryProvider<nunjucks.Environment> = {
  provide: NUNJUCKS_TOKEN,
  useFactory: createNunjucks,
};
