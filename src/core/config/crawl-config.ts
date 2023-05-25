import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import fs from 'fs-extra';
import { randomBytes } from 'crypto';

export type SeasonMode = 'auto' | 'manual';

export type CrawlMode = 'once' | 'until-stopped';

export interface CrawlConfig {
  // Todo: Remove? When API key is set? Or make required?
  /// Whether to load mock data (true) or request real data from API (false)
  mockApi: boolean;
  /// If "manual": crawl specified seasons, else: ("auto") crawl all currently active and unlocked
  seasonMode: SeasonMode;
  /// The seasons (ids) to crawl in "manual" season mode
  seasons: number[] | null;
  /// Whether to crawl standings, default false
  standings: boolean;
  /// Whether to crawl only once or forever (loop)
  crawlMode: CrawlMode;
  /// Time elapsed in milliseconds when to re-run a data refresh (if `crawlMode == 'until-stopped'`)
  refreshTimeout: number;
  /// Indicates to directly start crawling on start up, default to `true`
  autorun: boolean;
  /// The access token to the SDP API
  apiToken?: string;
  /// The endpoint of SDP API
  apiEndpoint?: string;
  /// The path to the JSON files holding the mocked data
  mockDbPath: string;
  // Todo: here?
  persistAsJson: boolean;
  persistSql: boolean;
  persistToDb: boolean;
  /// An array of secure inline script nonces
  scriptNonces: string[];
}

export const crawlConfig = registerAs<CrawlConfig>('crawl', () => ({
  ...extractBasics(),
  crawlMode: parseCrawlMode(process.env.CRAWL_MODE),
  refreshTimeout: parseInt(process.env.TIMEOUT, 10) || 60000,
  autorun: parseBoolean(process.env.AUTORUN) ?? true,
  persistAsJson: parseBoolean(process.env.PERSIST_AS_JSON) ?? false,
  persistToDb: parseBoolean(process.env.PERSIST_TO_DB) ?? true,
  persistSql: parseBoolean(process.env.PERSIST_SQL) ?? false,
  apiToken: process.env.API_TOKEN,
  apiEndpoint: process.env.API_BASE_URL,
  scriptNonces: createNonces(),
}));

function createNonces(): string[] {
  // randomly create 10 nonces, each html tag must have a unique nonce
  const nonces: string[] = [];
  for (let i = 0; i < 10; i++) {
    nonces.push(randomBytes(16).toString('hex'));
  }
  return nonces;
}

function extractBasics(): Pick<CrawlConfig, 'mockApi' | 'seasonMode' | 'seasons' | 'standings' | 'mockDbPath'> {
  const mockApi = parseMockApi(process.env.MOCK_API);
  const seasonMode = parseSeasonMode(process.env.SEASON_MODE);
  const mockDbPath = process.env.PATH_TO_MOCK_FILES || './mock-db';
  let standings: boolean;
  let seasons: number[] | null;

  // First, check if we need to extract IDs at all
  if (seasonMode === 'auto') {
    Logger.verbose(`Season mode is "auto". Skipping extraction of season IDs.`, 'Config');
    seasons = null;
  } else {
    seasons = parseSeasonIds(process.env.SEASONS)?.filter((id) => {
      // in fake mode only specific seasons (file system) are available
      if (mockApi) {
        const path = `${mockDbPath}/${id}/${id}.json`;
        if (!fs.pathExistsSync(path)) {
          Logger.warn(`Season ${id} does not exist on file system! Removing from array.`);
          return false;
        }
        return true;
      }
      // otherwise real mode and we cannot know -> all are valid
      return true;
    });
    if (!seasons || seasons.length === 0) {
      throw new Error(`No valid season IDs provided for "manual" mode. Aborting`);
    }
    Logger.verbose(`Manual season IDs: ${seasons.join(', ') || '---'}`, 'Config');
  }

  if (process.env.STANDINGS === 'true') {
    standings = true;
  } else {
    standings = false;
  }

  return {
    mockApi,
    seasonMode,
    seasons,
    standings,
    mockDbPath,
  };
}

function parseMockApi(mockApi: string): boolean {
  let useMockApi: boolean;

  if (!mockApi) {
    useMockApi = true; // default
    Logger.warn(`No config (mockApi) provided. Mocking the API...`, 'Config');
  } else {
    useMockApi = parseBoolean(mockApi);
  }

  if (useMockApi) {
    Logger.log(`Use fake API (static files from file system)`, 'Config');
  } else {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      throw new Error('Not possible to use mock API in production environments');
    }
    if (!process.env.API_TOKEN || !process.env.API_BASE_URL) {
      throw new Error('You have to provide a token and a base URL for the sport data provider (SDP)');
    }
    Logger.log(`Use real API @ ${process.env.API_BASE_URL}`, 'Config');
  }

  return useMockApi;
}

function parseSeasonMode(mode: string): SeasonMode {
  if (!mode || !['auto', 'manual'].includes(mode)) {
    Logger.warn(`No valid season mode provided. Using default: "manual"`, 'Config');
    return 'manual';
  }
  Logger.log(`Season mode is "${mode}"`, 'Config');
  return mode as SeasonMode;
}

function parseSeasonIds(seasons: string): number[] | null {
  const seasonIds = seasons
    ?.split(',')
    .map((e) => {
      const id = Number(e);
      if (!isNaN(id)) return id;
      else Logger.warn(`Season id ${e} is not a number! Removing from array.`, 'Config');
    })
    .filter(Boolean);

  if (!seasonIds || seasonIds.length === 0) {
    return null;
  }

  return seasonIds;
}

function parseCrawlMode(mode: string): CrawlMode {
  if (!mode || !['once', 'until-stopped'].includes(mode)) {
    Logger.warn(`No valid crawl mode provided. Using default: "until-stopped"`, 'Config');
    return 'until-stopped';
  }
  Logger.log(`Crawl mode is "${mode}"`, 'Config');
  return mode as CrawlMode;
}

// Todo: make parsing more robust -> remove comments
// Todo: Or find better config mechanism? (property file, lib)?
function parseBoolean(value: string): boolean | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return value === 'true' || value === '1';
}
