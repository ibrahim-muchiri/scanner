import { Inject, Injectable } from '@nestjs/common';
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AXIOS_TOKEN } from '../core/network/axios.provider';
import {
  ApiContinent,
  ApiCountry,
  ApiFixture,
  ApiLeague,
  ApiSeason,
  ApiStanding,
  ApiTeam,
  SportMonksResponse,
} from './models';

export abstract class SportApi {
  abstract fetchAllPlaceholders(ids: number[]): Promise<ApiTeam[]>;
  abstract fetchAllContinents(): Promise<ApiContinent[]>;
  abstract fetchAvailableCountries(): Promise<ApiCountry[]>;
  abstract fetchAvailableLeagues(): Promise<ApiLeague[]>;
  abstract fetchAvailableLeaguesWithCurrentSeasons(): Promise<ApiLeague[]>;
  abstract fetchFullSeason(id: number): Promise<ApiSeason>;
  abstract fetchLive(): Promise<ApiFixture[]>;
  abstract fetchTeamsOfSeason(id: number): Promise<ApiTeam[]>;
  abstract setBackSeasonToDate(seasonId: number, date_time: Date): string;
  abstract fetchSeasonStandings(seasonId: number): Promise<ApiStanding[]>;
}

@Injectable()
export class SportmonksApi implements SportApi {
  constructor(@Inject(AXIOS_TOKEN) private axios: AxiosInstance) {}

  setBackSeasonToDate(seasonId: number, date_time: Date): string {
    throw new Error('Method not implemented.');
  }

  async fetchAllContinents(): Promise<ApiContinent[]> {
    const res = await this.axios.get<SportMonksResponse<ApiContinent[]>>('/continents');
    return res.data.data;
  }

  async fetchAllPlaceholders(ids: number[]): Promise<ApiTeam[]> {
    let res: AxiosResponse<SportMonksResponse<ApiTeam[]>>;
    let data: ApiTeam[] = [];

    for (const id of ids) {
      res = await this.axios.get<SportMonksResponse<ApiTeam[]>>('/teams/' + id);
      data = data.concat(res.data.data);
    }

    data = data.filter((e) => e?.name.trim());
    return data;
  }

  async fetchAvailableCountries(): Promise<ApiCountry[]> {
    let res: AxiosResponse<SportMonksResponse<ApiCountry[]>>;
    let data: ApiCountry[] = [];
    const config: AxiosRequestConfig = {
      params: {
        page: 1,
      },
    };

    do {
      res = await this.axios.get<SportMonksResponse<ApiCountry[]>>('/countries', config);
      const pagination = res.data.meta.pagination;
      if (pagination) {
        console.log(`Loading "/countries" --> ${pagination.current_page}/${pagination.total_pages}`);
      }
      data = data.concat(res.data.data);
      config.params.page++;
    } while (res.data.meta.pagination && res.data.meta.pagination.links.next);

    data = data.filter((e) => e.name.trim());
    return data;
  }

  async fetchAvailableLeagues(): Promise<ApiLeague[]> {
    const res = await this.axios.get<SportMonksResponse<ApiLeague[]>>('/leagues');
    return res.data.data;
  }

  async fetchAvailableLeaguesWithCurrentSeasons(): Promise<ApiLeague[]> {
    const include = 'season'; // includes current season, which we are interested in
    const config: AxiosRequestConfig = { params: { include } };
    const res = await this.axios.get<SportMonksResponse<ApiLeague[]>>(`/leagues`, config);
    return res.data.data;
  }

  async fetchFullSeason(id: number): Promise<ApiSeason> {
    const include = 'league, stages, rounds, groups, teams, fixtures, fixtures.odds';
    const config: AxiosRequestConfig = {
      params: {
        include,
        markets: 1, // 3-way result
        bookmakers: 150, // bwin
      },
    };
    const res = await this.axios.get<SportMonksResponse<ApiSeason>>(`/seasons/${id}`, config);
    return res.data.data;
  }

  async fetchLive(): Promise<ApiFixture[]> {
    const config: AxiosRequestConfig = {
      params: {
        leagues: 1326,
        include: 'odds',
        markets: 1, // 3-way result
        bookmakers: 150, // bwin
      },
    };

    const res = await this.axios.get<SportMonksResponse<ApiFixture[]>>(`/livescores/now`, config);
    return res.data.data;
  }

  /**
   * Fetch all teams related to a particular season.
   *
   * @param id - The id of the considered season.
   */
  async fetchTeamsOfSeason(id: number): Promise<ApiTeam[]> {
    const res = await this.axios.get<SportMonksResponse<ApiTeam[]>>(`/teams/season/${id}`);
    return res.data.data;
  }

  async fetchSeasonStandings(id: number): Promise<ApiStanding[]> {
    const res = await this.axios.get<SportMonksResponse<ApiStanding[]>>(`/standings/season/${id}`);
    return res.data.data;
  }
}
