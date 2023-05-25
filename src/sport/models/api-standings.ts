import { ApiGroup } from './api-group.model';

export interface ApiStanding extends ApiGroup {
  type: string;
  standings: {
    data: ApiStandingEntry[];
  };
}

export interface ApiStandingEntry {
  position: number;
  team_id: number;
  team_name: string;
  round_id: number;
  round_name: number;
  group_id: number;
  group_name: string;
  overall: {
    games_played: number;
    won: number;
    draw: number;
    lost: number;
    goals_scored: number;
    goals_against: number;
    points: number;
  };
  home: {
    games_played: number;
    won: number;
    draw: number;
    lost: number;
    goals_scored: number;
    goals_against: number;
    points: number;
  };
  away: {
    games_played: number;
    won: number;
    draw: number;
    lost: number;
    goals_scored: number;
    goals_against: number;
    point: number;
  };
  total: {
    goal_difference: number;
    points: number;
  };
  result: string;
  points: number;
  recent_form: string;
  status: string;
  standings?: { data: ApiStandingEntry[] };
}
