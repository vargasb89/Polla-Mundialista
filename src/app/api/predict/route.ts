import { NextResponse } from "next/server";
import { z } from "zod";
import { demoResults, demoTeams } from "@/lib/demo-data";
import { predictScore } from "@/lib/model";

const PredictSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string()
});

export async function POST(request: Request) {
  const payload = PredictSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const homeTeam = demoTeams.find((team) => team.id === payload.data.homeTeamId);
  const awayTeam = demoTeams.find((team) => team.id === payload.data.awayTeamId);

  if (!homeTeam || !awayTeam) {
    return NextResponse.json({ error: "Equipo no encontrado." }, { status: 404 });
  }

  if (homeTeam.id === awayTeam.id) {
    return NextResponse.json({ error: "Elige dos equipos distintos." }, { status: 400 });
  }

  return NextResponse.json(predictScore(homeTeam, awayTeam, demoResults));
}
