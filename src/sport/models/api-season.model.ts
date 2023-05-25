import { ByData } from '../../core/network/by-data.model';
import { ApiLeague } from './api-league.model';
import { ApiStage } from './api-stage.model';
import { ApiRound } from './api-round.model';
import { ApiGroup } from './api-group.model';
import { ApiFixture } from './api-fixture.model';
import { ApiTeam } from './api-team.model';

export interface ApiSeason {
  id: number;
  name: string;
  league_id: number;
  is_current_season: boolean;
  current_round_id: number;
  current_stage_id: number;
  // possibly includes
  league?: ByData<ApiLeague>;
  teams?: ByData<ApiTeam[]>;
  stages?: ByData<ApiStage[]>;
  rounds?: ByData<ApiRound[]>;
  groups?: ByData<ApiGroup[]>;
  fixtures?: ByData<ApiFixture[]>;
}
