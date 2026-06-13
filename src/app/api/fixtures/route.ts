import { NextResponse } from "next/server";
import { demoFixtures } from "@/lib/demo-data";
import { predictScore } from "@/lib/model";
import { demoResults } from "@/lib/demo-data";
import { hasDatabase, sql } from "@/lib/db";
import type { Fixture, MatchResult, Team } from "@/lib/types";

type FixtureRow = {
  source: string;
  api_fixture_id: number;
  round: string | null;
  kickoff_at: string;
  status: string | null;
  home_api_team_id: number | null;
  home: string | null;
  home_code: string | null;
  home_rank: number | null;
  home_points: string | null;
  home_conf: string | null;
  away_api_team_id: number | null;
  away: string | null;
  away_code: string | null;
  away_rank: number | null;
  away_points: string | null;
  away_conf: string | null;
};

type HistoricalMatchRow = {
  source: string;
  api_fixture_id: number;
  played_at: string;
  home_api_team_id: number | null;
  away_api_team_id: number | null;
  home_team_name: string;
  away_team_name: string;
  home_code: string | null;
  away_code: string | null;
  home_fifa_rank: number | null;
  away_fifa_rank: number | null;
  home_fifa_points: string | null;
  away_fifa_points: string | null;
  home_goals: number;
  away_goals: number;
};

function parseRound(round: string | null) {
  if (!round) return { stage: "Mundial 2026", group: undefined };
  const [stage, group] = round.split(" - ");
  return { stage: stage || round, group };
}

function rowTeam(row: FixtureRow, side: "home" | "away"): Team {
  const prefix = side === "home" ? "home" : "away";
  const apiId = row[`${prefix}_api_team_id` as const];
  const name = row[prefix] ?? "TBD";
  const code = row[`${prefix}_code` as const] ?? undefined;
  const rank = row[`${prefix}_rank` as const] ?? 999;
  const points = row[`${prefix}_points` as const];
  const confederation = row[`${prefix}_conf` as const] ?? undefined;

  return {
    id: `${row.source}-${apiId ?? name}`.toLowerCase().replaceAll(" ", "-"),
    fifaId: apiId ? String(apiId) : undefined,
    name,
    countryCode: code,
    fifaRank: rank,
    fifaPoints: points ? Number(points) : undefined,
    confederation
  };
}

function rowFixture(row: FixtureRow): Fixture {
  const round = parseRound(row.round);

  return {
    id: `${row.source}-${row.api_fixture_id}`,
    matchNumber: row.api_fixture_id,
    stage: round.stage,
    group: round.group,
    playedAt: row.kickoff_at,
    homeTeam: rowTeam(row, "home"),
    awayTeam: rowTeam(row, "away"),
    isPlaceholder: !row.home || !row.away
  };
}

function historyTeam(row: HistoricalMatchRow, side: "home" | "away"): Team {
  const prefix = side === "home" ? "home" : "away";
  const apiId = row[`${prefix}_api_team_id` as const];
  const code = row[`${prefix}_code` as const] ?? undefined;
  const points = row[`${prefix}_fifa_points` as const];
  const name = row[`${prefix}_team_name` as const];

  return {
    id: `${row.source}-${apiId ?? code ?? name}`.toLowerCase().replaceAll(" ", "-"),
    fifaId: apiId ? String(apiId) : undefined,
    name,
    countryCode: code,
    fifaRank: row[`${prefix}_fifa_rank` as const] ?? 999,
    fifaPoints: points ? Number(points) : undefined
  };
}

function rowHistory(row: HistoricalMatchRow): MatchResult {
  return {
    id: `${row.source}-${row.api_fixture_id}`,
    playedAt: row.played_at,
    homeTeam: historyTeam(row, "home"),
    awayTeam: historyTeam(row, "away"),
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    neutralVenue: true
  };
}

export async function GET() {
  if (hasDatabase && sql) {
    const [rows, historyRows] = await Promise.all([
      sql`
        select f.source, f.api_fixture_id, f.round, f.kickoff_at, f.status,
               f.home_api_team_id, ht.name as home, ht.code as home_code,
               ht.fifa_rank as home_rank, ht.fifa_points as home_points, ht.confederation as home_conf,
               f.away_api_team_id, at.name as away, at.code as away_code,
               at.fifa_rank as away_rank, at.fifa_points as away_points, at.confederation as away_conf
        from fixtures f
        left join teams ht on ht.source = f.source and ht.api_team_id = f.home_api_team_id
        left join teams at on at.source = f.source and at.api_team_id = f.away_api_team_id
        where f.source = 'fifa'
        order by f.kickoff_at asc, f.api_fixture_id asc
      `,
      sql`
        select source, api_fixture_id, played_at,
               home_api_team_id, away_api_team_id, home_team_name, away_team_name,
               home_code, away_code, home_fifa_rank, away_fifa_rank,
               home_fifa_points, away_fifa_points, home_goals, away_goals
        from historical_matches
        where status = 'FT'
        order by played_at desc
      `
    ]);

    const historicalMatches = (historyRows as HistoricalMatchRow[]).length
      ? (historyRows as HistoricalMatchRow[]).map(rowHistory)
      : demoResults;

    const fixtures = (rows as FixtureRow[])
      .map(rowFixture)
      .map((fixture) => ({
        ...fixture,
        prediction:
          fixture.isPlaceholder || fixture.homeTeam.fifaRank === 999 || fixture.awayTeam.fifaRank === 999
            ? null
            : predictScore(fixture.homeTeam, fixture.awayTeam, historicalMatches)
      }));

    return NextResponse.json({
      fixtures,
      mode: "neon",
      source: "fifa",
      historyCount: historicalMatches.length,
      historySource: (historyRows as HistoricalMatchRow[]).length ? "api_football" : "demo"
    });
  }

  const fixtures = demoFixtures.map((fixture) => ({
    ...fixture,
    prediction: predictScore(fixture.homeTeam, fixture.awayTeam, demoResults)
  }));

  return NextResponse.json({ fixtures, mode: "demo" });
}
