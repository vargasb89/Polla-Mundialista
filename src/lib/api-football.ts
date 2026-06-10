import { z } from "zod";

const ApiFootballResponseSchema = z.object({
  get: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  errors: z.unknown().optional(),
  results: z.number().optional(),
  paging: z.unknown().optional(),
  response: z.array(z.unknown())
});

type ApiFootballOptions = {
  path: string;
  params?: Record<string, string | number | undefined>;
};

export class ApiFootballError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiFootballError";
  }
}

export async function apiFootballRequest({ path, params = {} }: ApiFootballOptions) {
  const key = process.env.API_FOOTBALL_KEY;
  const host = process.env.API_FOOTBALL_HOST ?? "v3.football.api-sports.io";
  const baseUrl = process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io";

  if (!key) {
    throw new ApiFootballError("Falta API_FOOTBALL_KEY en el ambiente.");
  }

  const url = new URL(path, baseUrl);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(name, String(value));
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": key,
      "x-rapidapi-host": host,
      "x-rapidapi-key": key
    },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new ApiFootballError(`API-FootBALL respondió ${response.status}.`);
  }

  return ApiFootballResponseSchema.parse(await response.json());
}
