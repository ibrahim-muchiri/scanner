import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import fs from 'fs-extra';
import { ApiSeason, ApiStanding, ApiTeam } from 'src/sport/models';
import { crawlConfig } from '../core/config';

/**
 * This class is used for writing data received from the sportmonks API to json files
 */
@Injectable()
export class FileWriter {
  private readonly logger = new Logger(FileWriter.name);

  constructor(
    @Inject(crawlConfig.KEY)
    private readonly config: ConfigType<typeof crawlConfig>,
  ) {}

  /**
   * This function writes the JSON return values of api.fetchFullSeason and api.fetchTeamsOfSeason into JSON files
   * @param season a complete season, league or tournament as JSON object
   * @param teams teams of season as json object
   * @returns the path where files are saved
   */
  createSeasonJsons(season: ApiSeason, teams: ApiTeam[]): string | undefined {
    if (!season || !season.league) {
      return undefined;
    }
    const outputPath = `${this.config.mockDbPath}/${season.id}/`;
    this.writeSeasonJson(season, outputPath);
    this.writeTeamJson(teams, outputPath);

    return outputPath;
  }

  /**
   * Create standings json files for a specific season
   * @param seasonId
   * @param standings
   */
  createStandingsJson(seasonId: number, standings: ApiStanding[]): void {
    const outputPath = `${this.config.mockDbPath}/${seasonId}/`;
    this.writeStandingJson(standings, outputPath);
  }

  /**
   * Creates a json file from a season json object
   * @param season a complete season, league or tournament as JSON object
   * @param outputPath
   */
  private async writeSeasonJson(season: ApiSeason, outputPath: string): Promise<boolean> {
    const filename = `${season.id}.json`;
    const outputFileName = outputPath + filename;
    return this.writeJsonFile(outputFileName, season);
  }

  /**
   * Creates a json file from a teams of season json object
   * @param teams teams of season as json object
   * @param path
   */
  private async writeTeamJson(teams: ApiTeam[], path: string): Promise<boolean> {
    const outputFilename = path + 'teams.json';
    return this.writeJsonFile(outputFilename, teams);
  }

  /**
   * Creates a json file from a standings of season object
   * @param standings
   * @param path
   * @returns
   */
  private async writeStandingJson(standings: ApiStanding[], path: string): Promise<boolean> {
    const outputFilename = path + 'standing.json';
    return this.writeJsonFile(outputFilename, standings);
  }

  public async writeJsonFile(filename: string, data: any): Promise<boolean> {
    return await fs
      .outputJSON(filename, data, { spaces: 2 })
      .then(() => {
        this.logger.verbose('Successfully created ' + filename);
        return true;
      })
      .catch((err) => {
        console.error(err);
        return false;
      });
  }
}
