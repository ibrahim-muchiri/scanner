export interface ApiFixture {
  id: number;
  league_id: number;
  season_id: number;
  stage_id: number;
  round_id: number;
  group_id: number;
  aggregate_id: number;
  venue_id: number;
  referee_id: number;
  localteam_id: number;
  visitorteam_id: number;
  winner_team_id: number;
  weather_report: ApiFixtureWeather;
  commentaries: any;
  attendance: number;
  pitch: any;
  details: any;
  neutral_venue: boolean;
  winning_odds_calculated: boolean;
  formations: {
    localteam_formation: string;
    visitorteam_formation: string;
  };
  scores: ApiFixtureScore;
  time: ApiFixtureTime;
  coaches: {
    localteam_coach_id: number;
    visitorteam_coach_id: number;
  };
  standings: {
    localteam_position: number;
    visitorteam_position: number;
  };
  assistants: {
    first_assistant_id: number;
    second_assistant_id: number;
    fourth_official_id: number;
  };
  leg: string;
  colors: ApiFixtureColors;
  deleted: boolean;
}

export interface ApiFixtureScore {
  localteam_score: number;
  visitorteam_score: number;
  localteam_pen_score?: number;
  visitorteam_pen_score?: number;
  ht_score: string;
  ft_score: string;
  et_score?: string;
  ps_score?: string;
}

export interface ApiFixtureTime {
  status: string;
  starting_at: ApiFixtureStartingAt;
  minute: number;
  second: number;
  added_time: number;
  extra_minute: number;
  injury_time: number;
}

export interface ApiFixtureStartingAt {
  date_time: string;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
}

export interface ApiFixtureWeather {
  code: string;
  type: string;
  icon: string;
  temperature: {
    temp: number;
    unit: string;
  };
  temperature_celcius: {
    temp: number;
    unit: string;
  };
  clouds: string;
  humidity: string;
  pressure: number;
  wind: {
    speed: string;
    degree: number;
  };
  coordinates: {
    lat: number;
    lon: number;
  };
  updated_at: string;
}

export interface ApiFixtureColors {
  localteam: {
    color: string;
    kit_colors: string;
  };
  visitorteam: {
    color: string;
    kit_colors: string;
  };
}
