"use client";

import { BarChart3, Database, Gauge, Goal, RefreshCw, Shield, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { demoFixtures, demoTeams } from "@/lib/demo-data";
import { formatPercent } from "@/lib/model";
import type { Prediction, Team } from "@/lib/types";

type AppFixture = {
  id: string;
  matchNumber?: number;
  stage: string;
  group?: string;
  playedAt: string;
  homeTeam: Team;
  awayTeam: Team;
  venue?: string;
  isPlaceholder?: boolean;
  prediction: Prediction | null;
};

const numberFormat = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function TeamSelect({
  label,
  value,
  onChange,
  teams,
  blockedTeamId
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  teams: Team[];
  blockedTeamId?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {teams.map((team) => (
          <option key={team.id} value={team.id} disabled={team.id === blockedTeamId}>
            {team.name} · Ranking {team.fifaRank}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProbabilityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="probability">
      <div className="probability-label">
        <span>{label}</span>
        <strong>{formatPercent(value)}</strong>
      </div>
      <div className="track">
        <div style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

function ScorePill({ prediction }: { prediction: Prediction }) {
  return (
    <div className="score-pill">
      <span>{prediction.homeTeam.countryCode}</span>
      <strong>
        {prediction.mostLikelyScore.homeGoals}-{prediction.mostLikelyScore.awayGoals}
      </strong>
      <span>{prediction.awayTeam.countryCode}</span>
    </div>
  );
}

function PredictionPanel({ prediction }: { prediction: Prediction }) {
  return (
    <section className="panel predictor-result">
      <div className="result-heading">
        <div>
          <p className="eyebrow">Marcador más probable</p>
          <h2>
            {prediction.homeTeam.name} {prediction.mostLikelyScore.homeGoals} -{" "}
            {prediction.mostLikelyScore.awayGoals} {prediction.awayTeam.name}
          </h2>
        </div>
        <ScorePill prediction={prediction} />
      </div>

      <div className="metric-grid">
        <div>
          <span>Goles esperados local</span>
          <strong>{numberFormat.format(prediction.expectedHomeGoals)}</strong>
        </div>
        <div>
          <span>Goles esperados visitante</span>
          <strong>{numberFormat.format(prediction.expectedAwayGoals)}</strong>
        </div>
        <div>
          <span>Confianza</span>
          <strong>{formatPercent(prediction.confidence)}</strong>
        </div>
        <div>
          <span>Muestra comparable</span>
          <strong>{prediction.sampleSize}</strong>
        </div>
      </div>

      <div className="probability-grid">
        <ProbabilityBar label={`Gana ${prediction.homeTeam.countryCode}`} value={prediction.homeWinProbability} />
        <ProbabilityBar label="Empate" value={prediction.drawProbability} />
        <ProbabilityBar label={`Gana ${prediction.awayTeam.countryCode}`} value={prediction.awayWinProbability} />
      </div>

      <div className="scores">
        {prediction.topScores.map((score) => (
          <div key={`${score.homeGoals}-${score.awayGoals}`}>
            <strong>
              {score.homeGoals}-{score.awayGoals}
            </strong>
            <span>{formatPercent(score.probability)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FixtureRow({
  homeTeam,
  awayTeam,
  stage,
  group,
  playedAt,
  venue,
  prediction
}: {
  homeTeam: Team;
  awayTeam: Team;
  stage: string;
  group?: string;
  playedAt: string;
  venue?: string;
  prediction: Prediction | null;
}) {
  return (
    <tr>
      <td>
        <span className="stage">{group ?? stage}</span>
      </td>
      <td>{new Date(playedAt).toLocaleDateString("es-CO", { month: "short", day: "numeric" })}</td>
      <td>
        <strong>{homeTeam.name}</strong>
        <span className="muted"> vs {awayTeam.name}</span>
        {venue ? <span className="venue">{venue}</span> : null}
      </td>
      <td>
        {prediction ? `${prediction.mostLikelyScore.homeGoals}-${prediction.mostLikelyScore.awayGoals}` : "TBD"}
      </td>
      <td>
        {prediction
          ? formatPercent(Math.max(prediction.homeWinProbability, prediction.drawProbability, prediction.awayWinProbability))
          : "-"}
      </td>
    </tr>
  );
}

export default function Home() {
  const [fixtures, setFixtures] = useState<AppFixture[]>(() =>
    demoFixtures.map((fixture) => ({
      ...fixture,
      prediction: null
    }))
  );
  const [homeTeamId, setHomeTeamId] = useState("fifa-43911");
  const [awayTeamId, setAwayTeamId] = useState("fifa-43883");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Cargando fixtures desde Neon...");

  async function fetchFixtures() {
    const response = await fetch("/api/fixtures", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "No se pudieron cargar fixtures.");
    return payload as { mode: string; fixtures: AppFixture[]; historyCount?: number; historySource?: string };
  }

  async function loadFixtures() {
    const payload = await fetchFixtures();
    setFixtures(payload.fixtures);
    setSyncMessage(
      payload.mode === "neon"
        ? `Neon activo: ${payload.fixtures.length} fixtures FIFA y ${payload.historyCount ?? 0} históricos cargados.`
        : "Modo demo activo."
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function run() {
      try {
        const payload = await fetchFixtures();
        if (!isMounted) return;
        setFixtures(payload.fixtures);
        setSyncMessage(
          payload.mode === "neon"
            ? `Neon activo: ${payload.fixtures.length} fixtures FIFA y ${payload.historyCount ?? 0} históricos cargados.`
            : "Modo demo activo."
        );
      } catch (error) {
        if (isMounted) {
          setSyncMessage(error instanceof Error ? error.message : "No se pudieron cargar fixtures.");
        }
      }
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, []);

  const teams = useMemo(() => {
    const byId = new Map<string, Team>();
    for (const fixture of fixtures) {
      if (!fixture.isPlaceholder) {
        byId.set(fixture.homeTeam.id, fixture.homeTeam);
        byId.set(fixture.awayTeam.id, fixture.awayTeam);
      }
    }

    if (byId.size === 0) {
      for (const team of demoTeams) byId.set(team.id, team);
    }

    return [...byId.values()].sort((a, b) => a.fifaRank - b.fifaRank || a.name.localeCompare(b.name));
  }, [fixtures]);

  const selectedHomeTeamId = teams.some((team) => team.id === homeTeamId) ? homeTeamId : teams[0]?.id;
  const selectedAwayTeamId =
    teams.some((team) => team.id === awayTeamId) && awayTeamId !== selectedHomeTeamId
      ? awayTeamId
      : teams.find((team) => team.id !== selectedHomeTeamId)?.id;

  const prediction = useMemo(() => {
    const directFixture = fixtures.find(
      (fixture) => fixture.homeTeam.id === selectedHomeTeamId && fixture.awayTeam.id === selectedAwayTeamId
    );
    const reverseFixture = fixtures.find(
      (fixture) => fixture.homeTeam.id === selectedAwayTeamId && fixture.awayTeam.id === selectedHomeTeamId
    );

    return directFixture?.prediction ?? reverseFixture?.prediction ?? fixtures.find((fixture) => fixture.prediction)?.prediction;
  }, [fixtures, selectedAwayTeamId, selectedHomeTeamId]);

  async function syncWorldCup() {
    setIsSyncing(true);
    setSyncMessage("Consultando API-FootBALL...");
    try {
      const response = await fetch("/api/import/world-cup", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo importar.");
      setSyncMessage(payload.warning ?? `Importados ${payload.imported} de ${payload.fetched} partidos.`);
      await loadFixtures();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "No se pudo importar.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function validateFifaFixtures() {
    setIsSyncing(true);
    setSyncMessage("Validando fixtures en FIFA...");
    try {
      const response = await fetch("/api/fifa/fixtures");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo validar FIFA.");
      setSyncMessage(
        `FIFA validado: ${payload.total} partidos, ${payload.confirmedTeams} con equipos confirmados y ${payload.placeholderFixtures} de knockout por definir.`
      );
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "No se pudo validar FIFA.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Polla Mundial 2026</p>
          <h1>Predictor de marcadores para maximizar puntos.</h1>
          <p>
            Estima el marcador más probable de cada cruce usando ranking FIFA, partidos comparables y una matriz
            Poisson preparada para alimentarse con API-FootBALL y Neon.
          </p>
        </div>
        <div className="hero-stats" aria-label="Estado del sistema">
          <div>
            <Trophy size={18} />
            <strong>104</strong>
            <span>partidos objetivo</span>
          </div>
          <div>
            <Database size={18} />
            <strong>Neon</strong>
            <span>listo para histórico</span>
          </div>
          <div>
            <Gauge size={18} />
            <strong>Top 8</strong>
            <span>marcadores por cruce</span>
          </div>
        </div>
      </section>

      <section className="workspace">
        <section className="panel controls">
          <div className="panel-title">
            <Shield size={20} />
            <div>
              <p className="eyebrow">Simulador</p>
              <h2>Elige un cruce</h2>
            </div>
          </div>

          <div className="select-grid">
            <TeamSelect
              label="Equipo A"
              value={selectedHomeTeamId ?? ""}
              onChange={setHomeTeamId}
              teams={teams}
              blockedTeamId={selectedAwayTeamId}
            />
            <TeamSelect
              label="Equipo B"
              value={selectedAwayTeamId ?? ""}
              onChange={setAwayTeamId}
              teams={teams}
              blockedTeamId={selectedHomeTeamId}
            />
          </div>

          <button className="sync-button" onClick={validateFifaFixtures} disabled={isSyncing}>
            <RefreshCw size={18} className={isSyncing ? "spin" : undefined} />
            <span>{isSyncing ? "Validando" : "Validar fixtures en FIFA"}</span>
          </button>

          <button className="sync-button secondary" onClick={syncWorldCup} disabled={isSyncing}>
            <RefreshCw size={18} className={isSyncing ? "spin" : undefined} />
            <span>{isSyncing ? "Sincronizando" : "Importar Mundial desde API-FootBALL"}</span>
          </button>
          <p className="sync-status">{syncMessage}</p>
        </section>

        {prediction ? <PredictionPanel prediction={prediction} /> : null}
      </section>

      <section className="table-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Batch de Polla</p>
            <h2>Primeros fixtures oficiales FIFA</h2>
          </div>
          <div className="badge">
            <BarChart3 size={16} />
            <span>Modelo v0.1</span>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fase</th>
                <th>Fecha</th>
                <th>Partido y sede</th>
                <th>Marcador</th>
                <th>Prob. mayor</th>
              </tr>
            </thead>
            <tbody>
              {fixtures.slice(0, 72).map((fixture) => (
                <FixtureRow key={fixture.id} {...fixture} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="method">
        <div>
          <Goal size={20} />
          <h2>Cómo decide</h2>
        </div>
        <p>
          Toma la diferencia de ranking FIFA, busca resultados con diferencias parecidas, pondera por recencia y
          transforma goles esperados en probabilidades de marcador exacto. Es una base transparente: cuando conectemos
          más temporadas, mejora sin cambiar la experiencia de uso.
        </p>
      </section>
    </main>
  );
}
