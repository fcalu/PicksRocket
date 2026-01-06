export type Odds = {
  provider?: string;
  details?: string;
  over_under?: number | null;
};

export type TeamRef = { name?: string; abbr?: string };

export type GameRow = {
  event_id: string;
  matchup: string;
  home_team?: TeamRef;
  away_team?: TeamRef;
  odds?: Odds;
};
