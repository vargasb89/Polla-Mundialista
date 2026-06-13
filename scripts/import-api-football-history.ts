import { neon } from "@neondatabase/serverless";
import { apiFootballRequest } from "../src/lib/api-football";
import { fetchFifaRankings } from "../src/lib/fifa-official";
import { canonicalTeamName, normalizeTeamName } from "../src/lib/team-mapping";

type ApiFixture = {
  fixture?: { id?: number; date?: string; status?: { short?: string } };
  league?: { name?: string; country?: string; season?: number };
  teams?: {
    home?: { id?: number; name?: string };
    away?: { id?: number; name?: string };
  };
  goals?: { home?: number | null; away?: number | null };
};

type RankingInfo = {
  code: string;
  rank: number;
  points: number;
  name: string;
};

const text = (value?: Array<{ Locale: string; Description: string }>) => value?.[0]?.Description ?? "";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function buildRankings() {
  const rankings = await fetchFifaRankings();
  const byCode = new Map<string, RankingInfo>();
  const byName = new Map<string, RankingInfo>();

  for (const [code, ranking] of rankings) {
    const value = ranking as unknown as {
      TeamName?: Array<{ Locale: string; Description: string }>;
      Rank?: number;
      TotalPoints?: number;
    };
    const name = text(value.TeamName);
    const info = {
      code,
      rank: value.Rank ?? 999,
      points: value.TotalPoints ?? 0,
      name
    };

    byCode.set(code, info);
    if (name) byName.set(normalizeTeamName(name), info);
  }

  return { byCode, byName };
}

function rankForTeam(name: string, rankings: Awaited<ReturnType<typeof buildRankings>>) {
  const canonical = canonicalTeamName(name);
  return rankings.byName.get(normalizeTeamName(canonical));
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  const sql = neon(databaseUrl);
  const rankings = await buildRankings();
  const apiTeams = (await sql`
    select distinct api_team_id, name
    from teams
    where source = 'api_football' and api_team_id is not null
    order by name
  `) as { api_team_id: number; name: string }[];

  const historical = new Map<number, ApiFixture>();

  for (const [index, team] of apiTeams.entries()) {
    const data = await apiFootballRequest({
      path: "/fixtures",
      params: { team: team.api_team_id, last: 50 }
    });

    for (const item of data.response as ApiFixture[]) {
      const fixtureId = item.fixture?.id;
      const status = item.fixture?.status?.short;
      const homeGoals = item.goals?.home;
      const awayGoals = item.goals?.away;

      if (!fixtureId || status !== "FT" || homeGoals === null || awayGoals === null) continue;
      historical.set(fixtureId, item);
    }

    console.log(`Histórico ${index + 1}/${apiTeams.length}: ${team.name}`);
    await sleep(120);
  }

  let imported = 0;
  let withoutRank = 0;

  for (const item of historical.values()) {
    const fixture = item.fixture;
    const home = item.teams?.home;
    const away = item.teams?.away;
    const homeGoals = item.goals?.home;
    const awayGoals = item.goals?.away;

    if (
      !fixture?.id ||
      !fixture.date ||
      !home?.id ||
      !away?.id ||
      !home.name ||
      !away.name ||
      homeGoals === null ||
      awayGoals === null
    ) {
      continue;
    }

    const homeRank = rankForTeam(home.name, rankings);
    const awayRank = rankForTeam(away.name, rankings);
    if (!homeRank || !awayRank) withoutRank += 1;

    await sql`
      insert into historical_matches (
        source, api_fixture_id, played_at, competition,
        home_api_team_id, away_api_team_id, home_team_name, away_team_name,
        home_code, away_code, home_fifa_rank, away_fifa_rank,
        home_fifa_points, away_fifa_points, home_goals, away_goals, status
      )
      values (
        'api_football', ${fixture.id}, ${fixture.date}, ${item.league?.name ?? null},
        ${home.id}, ${away.id}, ${canonicalTeamName(home.name)}, ${canonicalTeamName(away.name)},
        ${homeRank?.code ?? null}, ${awayRank?.code ?? null},
        ${homeRank?.rank ?? null}, ${awayRank?.rank ?? null},
        ${homeRank?.points ?? null}, ${awayRank?.points ?? null},
        ${homeGoals}, ${awayGoals}, ${fixture.status?.short ?? null}
      )
      on conflict (source, api_fixture_id) do update set
        played_at = excluded.played_at,
        competition = excluded.competition,
        home_api_team_id = excluded.home_api_team_id,
        away_api_team_id = excluded.away_api_team_id,
        home_team_name = excluded.home_team_name,
        away_team_name = excluded.away_team_name,
        home_code = excluded.home_code,
        away_code = excluded.away_code,
        home_fifa_rank = excluded.home_fifa_rank,
        away_fifa_rank = excluded.away_fifa_rank,
        home_fifa_points = excluded.home_fifa_points,
        away_fifa_points = excluded.away_fifa_points,
        home_goals = excluded.home_goals,
        away_goals = excluded.away_goals,
        status = excluded.status,
        updated_at = now()
    `;

    imported += 1;
  }

  console.log(`Históricos guardados: ${imported}. Sin ranking completo: ${withoutRank}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
