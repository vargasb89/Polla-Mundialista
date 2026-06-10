import type { Fixture, Team } from "./types";

const FIFA_API_BASE_URL = "https://api.fifa.com/api/v3";
export const FIFA_WORLD_CUP_COMPETITION_ID = "17";
export const FIFA_WORLD_CUP_2026_SEASON_ID = "285023";

type LocalizedText = Array<{ Locale: string; Description: string }>;

type FifaRanking = {
  IdTeam: string;
  TeamName: LocalizedText;
  IdCountry: string;
  Rank: number;
  TotalPoints: number;
  ConfederationName?: string;
};

type FifaTeam = {
  IdTeam?: string;
  IdCountry?: string;
  TeamName?: LocalizedText;
  Abbreviation?: string;
};

type FifaMatch = {
  IdMatch: string;
  MatchNumber?: number;
  Date: string;
  StageName?: LocalizedText;
  GroupName?: LocalizedText;
  Home?: FifaTeam;
  Away?: FifaTeam;
  PlaceHolderA?: string;
  PlaceHolderB?: string;
  Stadium?: {
    Name?: LocalizedText;
    CityName?: LocalizedText;
  };
};

const text = (value?: LocalizedText) => value?.[0]?.Description ?? "";

async function fifaGet<T>(path: string): Promise<T> {
  const response = await fetch(`${FIFA_API_BASE_URL}${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`FIFA API respondió ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchFifaRankings() {
  const data = await fifaGet<{ Results?: FifaRanking[] }>(
    "/fifarankings/rankings/approved?gender=1&count=300&language=en&sportType=0"
  );

  return new Map((data.Results ?? []).map((ranking) => [ranking.IdCountry, ranking]));
}

function toTeam(team: FifaTeam | undefined, rankings: Map<string, FifaRanking>, fallback: string): Team {
  const countryCode = team?.IdCountry ?? team?.Abbreviation;
  const ranking = countryCode ? rankings.get(countryCode) : undefined;

  return {
    id: (countryCode ?? fallback).toLowerCase(),
    fifaId: team?.IdTeam,
    name: text(team?.TeamName) || fallback,
    countryCode,
    fifaRank: ranking?.Rank ?? 999,
    fifaPoints: ranking?.TotalPoints,
    confederation: ranking?.ConfederationName
  };
}

export async function fetchOfficialWorldCupFixtures(): Promise<Fixture[]> {
  const [rankings, data] = await Promise.all([
    fetchFifaRankings(),
    fifaGet<{ Results?: FifaMatch[] }>(
      `/calendar/matches?idSeason=${FIFA_WORLD_CUP_2026_SEASON_ID}&language=en&count=200`
    )
  ]);

  return (data.Results ?? [])
    .map((match) => {
      const homePlaceholder = match.PlaceHolderA ?? "TBD";
      const awayPlaceholder = match.PlaceHolderB ?? "TBD";

      return {
        id: match.IdMatch,
        matchNumber: match.MatchNumber,
        stage: text(match.StageName) || "Unknown stage",
        group: text(match.GroupName) || undefined,
        playedAt: match.Date,
        homeTeam: toTeam(match.Home, rankings, homePlaceholder),
        awayTeam: toTeam(match.Away, rankings, awayPlaceholder),
        venue: text(match.Stadium?.Name) || undefined,
        city: text(match.Stadium?.CityName) || undefined,
        isPlaceholder: !match.Home?.TeamName?.length || !match.Away?.TeamName?.length
      };
    })
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());
}
