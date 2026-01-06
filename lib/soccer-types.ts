export type SoccerTournament = {
  id: string;
  league_code: string;
  label: string;
  is_default?: boolean;
};

export type SoccerGameRow = {
  event_id: string;
  matchup: string;
  home_team?: { name?: string; abbr?: string };
  away_team?: { name?: string; abbr?: string };
  odds?: {
    provider?: string;
    details?: string;
    over_under?: number | null;
  };
};

export type SoccerPick = {
  market: "OVER_25" | "1X2" | "DOUBLE_CHANCE";
  pick: string; // e.g. "OVER", "UNDER", "1", "X", "2", "1X", "12", "X2", "NO BET"
  confidence: "Alta" | "Media-Alta" | "Media" | "Baja";
  prob: number;
  edge_pct?: number | null;
  note?: string;
};

export type SoccerGameProjection = {
  event_id: string;
  league_code?: string;
  matchup: string;
  home_team?: { name?: string; abbr?: string };
  away_team?: { name?: string; abbr?: string };
  book_over_under?: number | null;
  expected_goals?: number | null;
  prob_over25?: number | null;
  prob_1?: number | null;
  prob_X?: number | null;
  prob_2?: number | null;
  over25_pick?: SoccerPick;
  pick_1x2?: SoccerPick;
  double_chance_best?: SoccerPick;
};

export type SoccerAiPick = {
  id: string;
  event_id: string;
  league: string;
  matchup: string;
  home_team?: { name?: string; abbr?: string };
  away_team?: { name?: string; abbr?: string };
  provider?: string;
  book_details?: string;
  book_over_under?: number | null;
  market: SoccerPick["market"];
  pick: string;
  confidence: SoccerPick["confidence"];
  prob: number;
  edge_pct?: number | null;
  note?: string;
};
