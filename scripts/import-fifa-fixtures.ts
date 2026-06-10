import { neon } from "@neondatabase/serverless";
import { fetchOfficialWorldCupFixtures } from "../src/lib/fifa-official";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  const sql = neon(databaseUrl);
  const fixtures = await fetchOfficialWorldCupFixtures();

  let imported = 0;
  for (const fixture of fixtures) {
    const homeApiTeamId = fixture.homeTeam.fifaId ? Number(fixture.homeTeam.fifaId) : null;
    const awayApiTeamId = fixture.awayTeam.fifaId ? Number(fixture.awayTeam.fifaId) : null;
    const apiFixtureId = Number(fixture.id);

    if (!Number.isFinite(apiFixtureId)) continue;

    if (homeApiTeamId) {
      await sql`
      insert into teams (source, api_team_id, name, code, fifa_rank, fifa_points, confederation)
      values (
        'fifa',
        ${homeApiTeamId},
        ${fixture.homeTeam.name},
        ${fixture.homeTeam.countryCode ?? null},
        ${fixture.homeTeam.fifaRank === 999 ? null : fixture.homeTeam.fifaRank},
        ${fixture.homeTeam.fifaPoints ?? null},
        ${fixture.homeTeam.confederation ?? null}
      )
      on conflict (source, api_team_id) do update set
        name = excluded.name,
        code = excluded.code,
        fifa_rank = excluded.fifa_rank,
        fifa_points = excluded.fifa_points,
        confederation = excluded.confederation,
        updated_at = now()
    `;
    }

    if (awayApiTeamId) {
      await sql`
      insert into teams (source, api_team_id, name, code, fifa_rank, fifa_points, confederation)
      values (
        'fifa',
        ${awayApiTeamId},
        ${fixture.awayTeam.name},
        ${fixture.awayTeam.countryCode ?? null},
        ${fixture.awayTeam.fifaRank === 999 ? null : fixture.awayTeam.fifaRank},
        ${fixture.awayTeam.fifaPoints ?? null},
        ${fixture.awayTeam.confederation ?? null}
      )
      on conflict (source, api_team_id) do update set
        name = excluded.name,
        code = excluded.code,
        fifa_rank = excluded.fifa_rank,
        fifa_points = excluded.fifa_points,
        confederation = excluded.confederation,
        updated_at = now()
    `;
    }

    await sql`
      insert into fixtures (
        source, api_fixture_id, league_id, season, round, kickoff_at, status,
        home_api_team_id, away_api_team_id, home_goals, away_goals
      )
      values (
        'fifa', ${apiFixtureId}, 17, 2026,
        ${fixture.group ? `${fixture.stage} - ${fixture.group}` : fixture.stage},
        ${fixture.playedAt}, ${fixture.isPlaceholder ? "placeholder" : "scheduled"},
        ${homeApiTeamId}, ${awayApiTeamId}, null, null
      )
      on conflict (source, api_fixture_id) do update set
        round = excluded.round,
        kickoff_at = excluded.kickoff_at,
        status = excluded.status,
        home_api_team_id = excluded.home_api_team_id,
        away_api_team_id = excluded.away_api_team_id,
        updated_at = now()
    `;

    imported += 1;
  }

  console.log(`Fixtures FIFA importados en Neon: ${imported}/${fixtures.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
