// API-Football Base Response
export interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, any>;
  errors: string[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

// Fixture Status
export interface FixtureStatus {
  long: string;
  short: '1H' | '2H' | 'HT' | 'FT' | 'NS' | 'PST' | 'ABD' | 'AWD';
  elapsed: number | null;
  extra: number | null;
}

// Fixture Venue
export interface FixtureVenue {
  id: number | null;
  name: string | null;
  city: string | null;
}

// Fixture Periods
export interface FixturePeriods {
  first: number | null;
  second: number | null;
}

// Fixture
export interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: FixturePeriods;
  venue: FixtureVenue;
  status: FixtureStatus;
}

// League
export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  round: string;
  standings: boolean;
}

// Team
export interface Team {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

// Teams
export interface Teams {
  home: Team;
  away: Team;
}

// Goals
export interface Goals {
  home: number | null;
  away: number | null;
}

// Score
export interface ScoreDetail {
  home: number | null;
  away: number | null;
}

export interface Score {
  halftime: ScoreDetail;
  fulltime: ScoreDetail;
  extratime: ScoreDetail;
  penalty: ScoreDetail;
}

// Event
export interface EventTime {
  elapsed: number;
  extra: number | null;
}

export interface EventTeam {
  id: number;
  name: string;
  logo: string;
}

export interface EventPlayer {
  id: number | null;
  name: string | null;
}

export interface EventAssist {
  id: number | null;
  name: string | null;
}

export interface Event {
  time: EventTime;
  team: EventTeam;
  player: EventPlayer;
  assist: EventAssist;
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
  comments: string | null;
}

// Fixture Item (Canlı maç listesindeki her bir öğe)
export interface FixtureItem {
  fixture: Fixture;
  league: League;
  teams: Teams;
  goals: Goals;
  score: Score;
  events: Event[];
}

// İstatistik
export interface StatisticValue {
  type: string;
  value: number | string | null;
}

export interface TeamStatistics {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: StatisticValue[];
}

export interface FixtureStatisticsResponse {
  response: TeamStatistics[];
}

// Lig (getLeagues için)
export interface LeagueCoverage {
  fixtures: {
    events: boolean;
    lineups: boolean;
    statistics_fixtures: boolean;
    statistics_players: boolean;
  };
  standings: boolean;
  players: boolean;
  top_scorers: boolean;
  top_assists: boolean;
  top_cards: boolean;
  injuries: boolean;
  predictions: boolean;
  odds: boolean;
}

export interface LeagueItem {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string | null;
    flag: string | null;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
    coverage: LeagueCoverage;
  }>;
}
