import { demoFixtures } from "../src/lib/demo-data";
import { fetchOfficialWorldCupFixtures } from "../src/lib/fifa-official";

async function main() {
  const officialFixtures = await fetchOfficialWorldCupFixtures();
  const officialPairs = new Set(
    officialFixtures.map((fixture) => `${fixture.homeTeam.name.toLowerCase()}|${fixture.awayTeam.name.toLowerCase()}`)
  );

  const invalidDemoFixtures = demoFixtures.filter(
    (fixture) => !officialPairs.has(`${fixture.homeTeam.name.toLowerCase()}|${fixture.awayTeam.name.toLowerCase()}`)
  );

  console.log(`FIFA fixtures oficiales: ${officialFixtures.length}`);
  console.log(`Partidos con equipos confirmados: ${officialFixtures.filter((fixture) => !fixture.isPlaceholder).length}`);
  console.log(`Partidos con placeholders de knockout: ${officialFixtures.filter((fixture) => fixture.isPlaceholder).length}`);
  console.log(`Fixtures demo no encontrados en FIFA: ${invalidDemoFixtures.length}`);

  for (const fixture of invalidDemoFixtures) {
    console.log(`- ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
  }

  console.log("\nPrimeros 12 fixtures FIFA:");
  for (const fixture of officialFixtures.slice(0, 12)) {
    console.log(
      `${fixture.matchNumber}. ${fixture.playedAt} · ${fixture.group ?? fixture.stage} · ${fixture.homeTeam.name} vs ${fixture.awayTeam.name} · ${fixture.venue}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
