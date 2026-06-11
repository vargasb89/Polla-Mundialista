import type { MatchResult, Prediction, ScoreProbability, Team } from "./types";

const MAX_GOALS = 7;
const BASE_WORLD_CUP_GOALS = 1.28;
const HOME_EDGE = 0.08;

type TeamStrength = {
  attack: number;
  defense: number;
  games: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const factorial = (value: number): number => {
  if (value <= 1) return 1;
  let total = 1;
  for (let i = 2; i <= value; i += 1) total *= i;
  return total;
};

const poisson = (goals: number, lambda: number) => (Math.exp(-lambda) * Math.pow(lambda, goals)) / factorial(goals);

const recencyWeight = (playedAt: string) => {
  const days = Math.max(0, (Date.now() - new Date(playedAt).getTime()) / 86_400_000);
  return Math.exp(-days / 540);
};

const rankingDelta = (home: Team, away: Team) => away.fifaRank - home.fifaRank;

const estimatedFifaPoints = (team: Team) => team.fifaPoints ?? clamp(1820 - team.fifaRank * 7.2, 900, 1900);

const matchupEdge = (home: Team, away: Team) => {
  const pointsEdge = clamp((estimatedFifaPoints(home) - estimatedFifaPoints(away)) / 560, -0.58, 0.58);
  const rankEdge = Math.tanh(rankingDelta(home, away) / 42) * 0.38;

  return pointsEdge * 0.68 + rankEdge * 0.32;
};

const teamProfile = (team: Team) => {
  const points = estimatedFifaPoints(team);
  const quality = clamp((points - 1500) / 520, -0.45, 0.55);
  const eliteBonus = team.fifaRank <= 10 ? 0.08 : team.fifaRank <= 25 ? 0.04 : 0;
  const lowRankPenalty = team.fifaRank >= 70 ? -0.08 : team.fifaRank >= 50 ? -0.04 : 0;

  return {
    attack: clamp(quality * 0.22 + eliteBonus + lowRankPenalty, -0.18, 0.28),
    defense: clamp(quality * 0.18 + eliteBonus * 0.6 + lowRankPenalty * 0.5, -0.15, 0.22)
  };
};

const buildStrengths = (matches: MatchResult[]) => {
  const raw = new Map<string, { scored: number; conceded: number; weight: number; games: number }>();

  for (const match of matches) {
    const weight = recencyWeight(match.playedAt);
    const home = raw.get(match.homeTeam.id) ?? { scored: 0, conceded: 0, weight: 0, games: 0 };
    const away = raw.get(match.awayTeam.id) ?? { scored: 0, conceded: 0, weight: 0, games: 0 };

    home.scored += match.homeGoals * weight;
    home.conceded += match.awayGoals * weight;
    home.weight += weight;
    home.games += 1;

    away.scored += match.awayGoals * weight;
    away.conceded += match.homeGoals * weight;
    away.weight += weight;
    away.games += 1;

    raw.set(match.homeTeam.id, home);
    raw.set(match.awayTeam.id, away);
  }

  const strengths = new Map<string, TeamStrength>();
  for (const [id, value] of raw) {
    const scored = value.scored / Math.max(value.weight, 0.1);
    const conceded = value.conceded / Math.max(value.weight, 0.1);
    strengths.set(id, {
      attack: clamp((scored - BASE_WORLD_CUP_GOALS) * 0.24, -0.3, 0.35),
      defense: clamp((BASE_WORLD_CUP_GOALS - conceded) * 0.22, -0.28, 0.32),
      games: value.games
    });
  }

  return strengths;
};

const similarMatchScore = (targetDelta: number, match: MatchResult) => {
  const matchDelta = rankingDelta(match.homeTeam, match.awayTeam);
  const distance = Math.abs(targetDelta - matchDelta);
  return Math.exp(-distance / 12) * recencyWeight(match.playedAt);
};

const similarGoalAdjustment = (home: Team, away: Team, matches: MatchResult[]) => {
  const targetDelta = rankingDelta(home, away);
  const weighted = matches
    .map((match) => ({
      match,
      score: similarMatchScore(targetDelta, match)
    }))
    .filter((entry) => entry.score > 0.18);

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.score, 0);
  if (!totalWeight) {
    return { home: 0, away: 0, sampleSize: 0 };
  }

  const homeAvg = weighted.reduce((sum, entry) => sum + entry.match.homeGoals * entry.score, 0) / totalWeight;
  const awayAvg = weighted.reduce((sum, entry) => sum + entry.match.awayGoals * entry.score, 0) / totalWeight;

  return {
    home: clamp((homeAvg - BASE_WORLD_CUP_GOALS) * 0.18, -0.22, 0.24),
    away: clamp((awayAvg - BASE_WORLD_CUP_GOALS) * 0.18, -0.22, 0.24),
    sampleSize: weighted.length
  };
};

const scoreMatrix = (expectedHomeGoals: number, expectedAwayGoals: number) => {
  const scores: ScoreProbability[] = [];
  let mass = 0;

  for (let homeGoals = 0; homeGoals <= MAX_GOALS; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= MAX_GOALS; awayGoals += 1) {
      const probability = poisson(homeGoals, expectedHomeGoals) * poisson(awayGoals, expectedAwayGoals);
      scores.push({ homeGoals, awayGoals, probability });
      mass += probability;
    }
  }

  return scores
    .map((score) => ({ ...score, probability: score.probability / mass }))
    .sort((a, b) => b.probability - a.probability);
};

export function predictScore(homeTeam: Team, awayTeam: Team, historicalMatches: MatchResult[]): Prediction {
  const strengths = buildStrengths(historicalMatches);
  const homeStrength = strengths.get(homeTeam.id) ?? { attack: 0, defense: 0, games: 0 };
  const awayStrength = strengths.get(awayTeam.id) ?? { attack: 0, defense: 0, games: 0 };
  const homeProfile = teamProfile(homeTeam);
  const awayProfile = teamProfile(awayTeam);
  const edge = matchupEdge(homeTeam, awayTeam);
  const similar = similarGoalAdjustment(homeTeam, awayTeam, historicalMatches);

  const expectedHomeGoals = clamp(
    BASE_WORLD_CUP_GOALS +
      HOME_EDGE +
      edge +
      homeProfile.attack -
      awayProfile.defense +
      homeStrength.attack -
      awayStrength.defense +
      similar.home,
    0.25,
    3.4
  );
  const expectedAwayGoals = clamp(
    BASE_WORLD_CUP_GOALS -
      HOME_EDGE -
      edge +
      awayProfile.attack -
      homeProfile.defense +
      awayStrength.attack -
      homeStrength.defense +
      similar.away,
    0.25,
    3.4
  );

  const topScores = scoreMatrix(expectedHomeGoals, expectedAwayGoals);
  const homeWinProbability = topScores
    .filter((score) => score.homeGoals > score.awayGoals)
    .reduce((sum, score) => sum + score.probability, 0);
  const drawProbability = topScores
    .filter((score) => score.homeGoals === score.awayGoals)
    .reduce((sum, score) => sum + score.probability, 0);
  const awayWinProbability = topScores
    .filter((score) => score.homeGoals < score.awayGoals)
    .reduce((sum, score) => sum + score.probability, 0);
  const sampleSize = similar.sampleSize + homeStrength.games + awayStrength.games;
  const confidence = clamp(0.32 + Math.log10(sampleSize + 1) * 0.2, 0.28, 0.82);

  return {
    homeTeam,
    awayTeam,
    expectedHomeGoals,
    expectedAwayGoals,
    mostLikelyScore: topScores[0],
    topScores: topScores.slice(0, 8),
    homeWinProbability,
    drawProbability,
    awayWinProbability,
    confidence,
    sampleSize,
    modelNotes: [
      "Modelo Poisson con ajuste por puntos y ranking FIFA.",
      "La muestra comparable usa partidos con diferencia de ranking parecida y más peso para partidos recientes.",
      "Los puntos FIFA evitan que partidos con favoritos de distinta fuerza terminen con la misma expectativa."
    ]
  };
}

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
