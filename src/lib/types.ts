export type Team = {
  id: string;
  fifaId?: string;
  name: string;
  countryCode?: string;
  fifaRank: number;
  fifaPoints?: number;
  confederation?: string;
};

export type MatchResult = {
  id: string;
  playedAt: string;
  homeTeam: Team;
  awayTeam: Team;
  homeGoals: number;
  awayGoals: number;
  neutralVenue?: boolean;
};

export type Fixture = {
  id: string;
  matchNumber?: number;
  stage: string;
  group?: string;
  playedAt: string;
  homeTeam: Team;
  awayTeam: Team;
  venue?: string;
  city?: string;
  isPlaceholder?: boolean;
};

export type ScoreProbability = {
  homeGoals: number;
  awayGoals: number;
  probability: number;
};

export type Prediction = {
  homeTeam: Team;
  awayTeam: Team;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  mostLikelyScore: ScoreProbability;
  topScores: ScoreProbability[];
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  confidence: number;
  sampleSize: number;
  modelNotes: string[];
};
