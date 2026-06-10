import { neon } from "@neondatabase/serverless";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  const sql = neon(databaseUrl);

  await sql`
  create table if not exists teams (
    id bigserial primary key,
    source text not null default 'api_football',
    api_team_id integer,
    name text not null,
    code text,
    logo_url text,
    fifa_rank integer,
    fifa_points numeric,
    confederation text,
    updated_at timestamptz not null default now()
  )
`;

  await sql`
  create table if not exists fixtures (
    id bigserial primary key,
    source text not null default 'api_football',
    api_fixture_id integer,
    league_id integer not null,
    season integer not null,
    round text,
    kickoff_at timestamptz,
    status text,
    home_api_team_id integer,
    away_api_team_id integer,
    home_goals integer,
    away_goals integer,
    updated_at timestamptz not null default now()
  )
`;

  await sql`
  create table if not exists predictions (
    id bigserial primary key,
    fixture_id bigint references fixtures(id),
    home_team_name text not null,
    away_team_name text not null,
    expected_home_goals numeric not null,
    expected_away_goals numeric not null,
    most_likely_home_goals integer not null,
    most_likely_away_goals integer not null,
    payload jsonb not null,
    created_at timestamptz not null default now()
  )
`;

  await sql`
  create table if not exists api_usage_log (
    id bigserial primary key,
    provider text not null,
    endpoint text not null,
    status text not null,
    created_at timestamptz not null default now()
  )
`;

  await sql`alter table teams add column if not exists source text not null default 'api_football'`;
  await sql`alter table fixtures add column if not exists source text not null default 'api_football'`;

  await sql`
    update fixtures
    set source = case when league_id = 17 then 'fifa' else 'api_football' end
    where source is null or source = 'api_football'
  `;

  await sql`
    update teams
    set source = 'fifa'
    where api_team_id in (
      select home_api_team_id from fixtures where source = 'fifa' and home_api_team_id is not null
      union
      select away_api_team_id from fixtures where source = 'fifa' and away_api_team_id is not null
    )
  `;

  await sql`
    update teams
    set source = 'api_football'
    where api_team_id in (
      select home_api_team_id from fixtures where source = 'api_football' and home_api_team_id is not null
      union
      select away_api_team_id from fixtures where source = 'api_football' and away_api_team_id is not null
    )
  `;

  await sql`
    do $$
    begin
      if exists (
        select 1 from pg_constraint
        where conname = 'fixtures_home_api_team_id_fkey'
      ) then
        alter table fixtures drop constraint fixtures_home_api_team_id_fkey;
      end if;

      if exists (
        select 1 from pg_constraint
        where conname = 'fixtures_away_api_team_id_fkey'
      ) then
        alter table fixtures drop constraint fixtures_away_api_team_id_fkey;
      end if;

      if exists (
        select 1 from pg_constraint
        where conname = 'teams_api_team_id_key'
      ) then
        alter table teams drop constraint teams_api_team_id_key;
      end if;
    end $$;
  `;

  await sql`
    do $$
    begin
      if exists (
        select 1 from pg_constraint
        where conname = 'fixtures_api_fixture_id_key'
      ) then
        alter table fixtures drop constraint fixtures_api_fixture_id_key;
      end if;
    end $$;
  `;

  await sql`create unique index if not exists teams_source_api_team_id_key on teams (source, api_team_id)`;
  await sql`create unique index if not exists fixtures_source_api_fixture_id_key on fixtures (source, api_fixture_id)`;

  console.log("Base Neon lista.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
