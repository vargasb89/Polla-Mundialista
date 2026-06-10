import { NextResponse } from "next/server";
import { apiFootballRequest, ApiFootballError } from "@/lib/api-football";
import { hasDatabase, sql } from "@/lib/db";

type ApiFixture = {
  fixture?: { id?: number; date?: string; status?: { short?: string } };
  league?: { id?: number; season?: number; round?: string };
  teams?: {
    home?: { id?: number; name?: string; logo?: string };
    away?: { id?: number; name?: string; logo?: string };
  };
  goals?: { home?: number | null; away?: number | null };
};

export async function POST() {
  try {
    const league = Number(process.env.WORLD_CUP_LEAGUE_ID ?? 1);
    const season = Number(process.env.WORLD_CUP_SEASON ?? 2026);
    const data = await apiFootballRequest({
      path: "/fixtures",
      params: { league, season }
    });

    if (!hasDatabase || !sql) {
      return NextResponse.json({
        imported: 0,
        fetched: data.response.length,
        warning: "API consultada, pero DATABASE_URL no está configurada. No se guardó en Neon."
      });
    }

    let imported = 0;
    for (const item of data.response as ApiFixture[]) {
      const home = item.teams?.home;
      const away = item.teams?.away;
      const fixture = item.fixture;

      if (!fixture?.id || !home?.id || !away?.id || !home.name || !away.name) continue;

      await sql`
        insert into teams (source, api_team_id, name, logo_url)
        values ('api_football', ${home.id}, ${home.name}, ${home.logo ?? null})
        on conflict (source, api_team_id) do update set name = excluded.name, logo_url = excluded.logo_url
      `;

      await sql`
        insert into teams (source, api_team_id, name, logo_url)
        values ('api_football', ${away.id}, ${away.name}, ${away.logo ?? null})
        on conflict (source, api_team_id) do update set name = excluded.name, logo_url = excluded.logo_url
      `;

      await sql`
        insert into fixtures (
          source, api_fixture_id, league_id, season, round, kickoff_at, status,
          home_api_team_id, away_api_team_id, home_goals, away_goals
        )
        values (
          'api_football', ${fixture.id}, ${item.league?.id ?? league}, ${item.league?.season ?? season},
          ${item.league?.round ?? null}, ${fixture.date ?? null}, ${fixture.status?.short ?? null},
          ${home.id}, ${away.id}, ${item.goals?.home ?? null}, ${item.goals?.away ?? null}
        )
        on conflict (source, api_fixture_id) do update set
          round = excluded.round,
          kickoff_at = excluded.kickoff_at,
          status = excluded.status,
          home_goals = excluded.home_goals,
          away_goals = excluded.away_goals
      `;
      imported += 1;
    }

    return NextResponse.json({ imported, fetched: data.response.length });
  } catch (error) {
    if (error instanceof ApiFootballError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudo importar el Mundial." }, { status: 500 });
  }
}
