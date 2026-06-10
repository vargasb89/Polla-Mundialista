import { NextResponse } from "next/server";
import { fetchOfficialWorldCupFixtures } from "@/lib/fifa-official";

export async function GET() {
  try {
    const fixtures = await fetchOfficialWorldCupFixtures();
    return NextResponse.json({
      source: "FIFA",
      total: fixtures.length,
      confirmedTeams: fixtures.filter((fixture) => !fixture.isPlaceholder).length,
      placeholderFixtures: fixtures.filter((fixture) => fixture.isPlaceholder).length,
      fixtures
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron cargar fixtures FIFA." },
      { status: 502 }
    );
  }
}
