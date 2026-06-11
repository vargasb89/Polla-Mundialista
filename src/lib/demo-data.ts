import type { Fixture, MatchResult, Team } from "./types";

export const demoTeams: Team[] = [
  { id: "fra", fifaId: "43946", name: "France", countryCode: "FRA", fifaRank: 1, fifaPoints: 1877.32, confederation: "UEFA" },
  { id: "esp", fifaId: "43969", name: "Spain", countryCode: "ESP", fifaRank: 2, fifaPoints: 1876.4, confederation: "UEFA" },
  { id: "arg", fifaId: "43922", name: "Argentina", countryCode: "ARG", fifaRank: 3, fifaPoints: 1874.81, confederation: "CONMEBOL" },
  { id: "eng", fifaId: "43942", name: "England", countryCode: "ENG", fifaRank: 4, fifaPoints: 1825.97, confederation: "UEFA" },
  { id: "por", fifaId: "43963", name: "Portugal", countryCode: "POR", fifaRank: 5, fifaPoints: 1763.83, confederation: "UEFA" },
  { id: "bra", fifaId: "43924", name: "Brazil", countryCode: "BRA", fifaRank: 6, fifaPoints: 1761.16, confederation: "CONMEBOL" },
  { id: "ned", fifaId: "43960", name: "Netherlands", countryCode: "NED", fifaRank: 7, fifaPoints: 1757.87, confederation: "UEFA" },
  { id: "mar", fifaId: "43872", name: "Morocco", countryCode: "MAR", fifaRank: 8, fifaPoints: 1755.87, confederation: "CAF" },
  { id: "ger", fifaId: "43948", name: "Germany", countryCode: "GER", fifaRank: 10, fifaPoints: 1730.37, confederation: "UEFA" },
  { id: "bel", name: "Belgium", countryCode: "BEL", fifaRank: 11, fifaPoints: 1705, confederation: "UEFA" },
  { id: "mex", fifaId: "43911", name: "Mexico", countryCode: "MEX", fifaRank: 15, fifaPoints: 1681.03, confederation: "CONCACAF" },
  { id: "usa", fifaId: "43921", name: "USA", countryCode: "USA", fifaRank: 16, fifaPoints: 1673.13, confederation: "CONCACAF" },
  { id: "jpn", fifaId: "43819", name: "Japan", countryCode: "JPN", fifaRank: 18, fifaPoints: 1660.43, confederation: "AFC" },
  { id: "sui", fifaId: "43971", name: "Switzerland", countryCode: "SUI", fifaRank: 19, fifaPoints: 1649.4, confederation: "UEFA" },
  { id: "tur", fifaId: "43972", name: "Türkiye", countryCode: "TUR", fifaRank: 22, fifaPoints: 1599.04, confederation: "UEFA" },
  { id: "ecu", fifaId: "43937", name: "Ecuador", countryCode: "ECU", fifaRank: 23, fifaPoints: 1594.78, confederation: "CONMEBOL" },
  { id: "kor", fifaId: "43822", name: "Korea Republic", countryCode: "KOR", fifaRank: 25, fifaPoints: 1588.66, confederation: "AFC" },
  { id: "aus", fifaId: "43976", name: "Australia", countryCode: "AUS", fifaRank: 27, fifaPoints: 1580.67, confederation: "AFC" },
  { id: "can", fifaId: "43843", name: "Canada", countryCode: "CAN", fifaRank: 30, fifaPoints: 1556.48, confederation: "CONCACAF" },
  { id: "civ", fifaId: "43854", name: "Côte d'Ivoire", countryCode: "CIV", fifaRank: 34, fifaPoints: 1532.98, confederation: "CAF" },
  { id: "swe", fifaId: "43970", name: "Sweden", countryCode: "SWE", fifaRank: 38, fifaPoints: 1514.77, confederation: "UEFA" },
  { id: "par", fifaId: "43962", name: "Paraguay", countryCode: "PAR", fifaRank: 41, fifaPoints: 1505.35, confederation: "CONMEBOL" },
  { id: "cze", fifaId: "43934", name: "Czechia", countryCode: "CZE", fifaRank: 41, fifaPoints: 1501.38, confederation: "UEFA" },
  { id: "sco", fifaId: "43967", name: "Scotland", countryCode: "SCO", fifaRank: 43, fifaPoints: 1498.35, confederation: "UEFA" },
  { id: "tun", fifaId: "43888", name: "Tunisia", countryCode: "TUN", fifaRank: 44, fifaPoints: 1483.05, confederation: "CAF" },
  { id: "qat", fifaId: "43835", name: "Qatar", countryCode: "QAT", fifaRank: 55, fifaPoints: 1454.96, confederation: "AFC" },
  { id: "rsa", fifaId: "43883", name: "South Africa", countryCode: "RSA", fifaRank: 60, fifaPoints: 1429.73, confederation: "CAF" },
  { id: "bih", fifaId: "43901", name: "Bosnia and Herzegovina", countryCode: "BIH", fifaRank: 65, fifaPoints: 1385.84, confederation: "UEFA" },
  { id: "cuw", fifaId: "43988", name: "Curaçao", countryCode: "CUW", fifaRank: 82, fifaPoints: 1294.65, confederation: "CONCACAF" },
  { id: "hai", fifaId: "43859", name: "Haiti", countryCode: "HAI", fifaRank: 83, fifaPoints: 1291.71, confederation: "CONCACAF" },
  { id: "col", name: "Colombia", countryCode: "COL", fifaRank: 14, fifaPoints: 1689, confederation: "CONMEBOL" },
  { id: "uru", fifaId: "43930", name: "Uruguay", countryCode: "URU", fifaRank: 17, fifaPoints: 1664, confederation: "CONMEBOL" },
  { id: "ita", name: "Italy", countryCode: "ITA", fifaRank: 12, fifaPoints: 1700, confederation: "UEFA" }
];

const byId = new Map(demoTeams.map((team) => [team.id, team]));

const team = (id: string) => {
  const value = byId.get(id);
  if (!value) {
    throw new Error(`Missing demo team ${id}`);
  }
  return value;
};

export const demoFixtures: Fixture[] = [
  {
    id: "400021443",
    matchNumber: 1,
    stage: "First Stage",
    group: "Group A",
    playedAt: "2026-06-11T19:00:00Z",
    homeTeam: team("mex"),
    awayTeam: team("rsa"),
    venue: "Mexico City Stadium",
    city: "Mexico City"
  },
  {
    id: "400021441",
    matchNumber: 2,
    stage: "First Stage",
    group: "Group A",
    playedAt: "2026-06-12T02:00:00Z",
    homeTeam: team("kor"),
    awayTeam: team("cze"),
    venue: "Guadalajara Stadium",
    city: "Guadalajara"
  },
  {
    id: "400021449",
    matchNumber: 3,
    stage: "First Stage",
    group: "Group B",
    playedAt: "2026-06-12T19:00:00Z",
    homeTeam: team("can"),
    awayTeam: team("bih"),
    venue: "Toronto Stadium",
    city: "Toronto"
  },
  {
    id: "400021458",
    matchNumber: 4,
    stage: "First Stage",
    group: "Group D",
    playedAt: "2026-06-13T01:00:00Z",
    homeTeam: team("usa"),
    awayTeam: team("par"),
    venue: "Los Angeles Stadium",
    city: "Los Angeles"
  },
  {
    id: "400021447",
    matchNumber: 8,
    stage: "First Stage",
    group: "Group B",
    playedAt: "2026-06-13T19:00:00Z",
    homeTeam: team("qat"),
    awayTeam: team("sui"),
    venue: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area"
  },
  {
    id: "400021456",
    matchNumber: 7,
    stage: "First Stage",
    group: "Group C",
    playedAt: "2026-06-13T22:00:00Z",
    homeTeam: team("bra"),
    awayTeam: team("mar"),
    venue: "New York/New Jersey Stadium",
    city: "New York New Jersey"
  }
];

export const demoResults: MatchResult[] = [
  { id: "m1", playedAt: "2025-06-10", homeTeam: team("arg"), awayTeam: team("col"), homeGoals: 1, awayGoals: 1, neutralVenue: true },
  { id: "m2", playedAt: "2025-07-02", homeTeam: team("fra"), awayTeam: team("bel"), homeGoals: 2, awayGoals: 0, neutralVenue: true },
  { id: "m3", playedAt: "2025-09-07", homeTeam: team("esp"), awayTeam: team("por"), homeGoals: 2, awayGoals: 1, neutralVenue: false },
  { id: "m4", playedAt: "2025-10-11", homeTeam: team("eng"), awayTeam: team("ned"), homeGoals: 1, awayGoals: 1, neutralVenue: true },
  { id: "m5", playedAt: "2025-11-13", homeTeam: team("bra"), awayTeam: team("uru"), homeGoals: 2, awayGoals: 1, neutralVenue: false },
  { id: "m6", playedAt: "2025-11-18", homeTeam: team("usa"), awayTeam: team("mex"), homeGoals: 1, awayGoals: 0, neutralVenue: false },
  { id: "m7", playedAt: "2026-03-21", homeTeam: team("ger"), awayTeam: team("ita"), homeGoals: 1, awayGoals: 2, neutralVenue: false },
  { id: "m8", playedAt: "2026-03-25", homeTeam: team("jpn"), awayTeam: team("mar"), homeGoals: 1, awayGoals: 1, neutralVenue: true },
  { id: "m9", playedAt: "2026-05-30", homeTeam: team("por"), awayTeam: team("col"), homeGoals: 2, awayGoals: 2, neutralVenue: true },
  { id: "m10", playedAt: "2026-06-02", homeTeam: team("ned"), awayTeam: team("bel"), homeGoals: 2, awayGoals: 1, neutralVenue: false },
  { id: "m11", playedAt: "2026-06-04", homeTeam: team("mex"), awayTeam: team("usa"), homeGoals: 1, awayGoals: 1, neutralVenue: true },
  { id: "m12", playedAt: "2026-06-05", homeTeam: team("fra"), awayTeam: team("eng"), homeGoals: 1, awayGoals: 0, neutralVenue: true }
];
