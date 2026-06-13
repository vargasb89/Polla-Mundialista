export const normalizeTeamName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const apiFootballNameAliases: Record<string, string> = {
  [normalizeTeamName("Bosnia & Herzegovina")]: "Bosnia and Herzegovina",
  [normalizeTeamName("Cape Verde Islands")]: "Cabo Verde",
  [normalizeTeamName("Czech Republic")]: "Czechia",
  [normalizeTeamName("Iran")]: "IR Iran",
  [normalizeTeamName("Ivory Coast")]: "Côte d'Ivoire",
  [normalizeTeamName("South Korea")]: "Korea Republic"
};

export const canonicalTeamName = (name: string) => apiFootballNameAliases[normalizeTeamName(name)] ?? name;
