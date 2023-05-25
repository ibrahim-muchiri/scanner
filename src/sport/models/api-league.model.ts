import { ByData } from '../../core/network/by-data.model';
import { ApiCountry } from './api-country.model';
import { ApiSeason } from './api-season.model';

export interface ApiLeague {
  id: number;
  active: boolean;
  legacy_id: number;
  country_id: number;
  logo_path: string;
  name: string;
  is_cup: boolean;
  current_season_id: number;
  current_round_id: number;
  current_stage_id: number;
  live_standings: boolean;
  coverage: {
    predictions: boolean;
    topscorer_goals: boolean;
    topscorer_assists: boolean;
    topscorer_cards: boolean;
  };
  // possibly includes
  season?: ByData<ApiSeason>;
  country?: ByData<ApiCountry>;
  seasons?: ByData<ApiSeason[]>;
}
