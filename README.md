# Polla Mundial Predictor

Aplicación para estimar el marcador más probable de cruces del Mundial y priorizar picks para una Polla.

## Decisión sobre API-FootBALL

El proyecto ya está preparado para API-FootBALL Pro.

- Plan Free: USD 0, 100 requests por día, acceso a endpoints como fixtures, head to head, statistics y predictions.
- Limitación clave del Free: no permite consultar el Mundial 2026 en API-FootBALL.
- Plan Pro: permite traer fixtures 2026 y subir el límite diario.

Regla práctica para este proyecto:

- FIFA oficial se usa como fuente base de fixtures completos y ranking.
- API-FootBALL Pro se usa para fixtures confirmados, estados, resultados e histórico para entrenar el modelo.

## Stack

- Next.js + TypeScript
- Neon Postgres
- API-FootBALL / API-SPORTS
- Modelo Poisson ajustado por ranking FIFA, recencia y partidos con diferencia de ranking similar

## Configuración

1. Copia el archivo de ambiente:

```bash
cp .env.example .env.local
```

2. Agrega las credenciales:

```bash
DATABASE_URL="postgresql://..."
API_FOOTBALL_KEY="..."
```

3. Instala y corre:

```bash
npm install
npm run dev
```

4. Si ya tienes Neon configurado, crea las tablas:

```bash
npm run db:init
```

## Validación oficial FIFA

Los fixtures se validan contra el API público que usa FIFA.com:

- Competición FIFA World Cup™: `17`
- Temporada FIFA World Cup 2026™: `285023`
- Endpoint de fixtures: `https://api.fifa.com/api/v3/calendar/matches?idSeason=285023&language=en&count=200`
- Endpoint de ranking FIFA: `https://api.fifa.com/api/v3/fifarankings/rankings/approved?gender=1&count=300&language=en&sportType=0`

Corre:

```bash
npm run fixtures:validate
```

Resultado esperado actualmente:

- 104 fixtures oficiales.
- 72 partidos de fase de grupos con equipos confirmados.
- 32 partidos de eliminación directa con placeholders.
- 0 fixtures de la muestra local fuera de FIFA.

## Endpoints internos

- `GET /api/health`: estado de credenciales.
- `GET /api/fifa/fixtures`: fixtures oficiales FIFA 2026 con ranking FIFA actualizado.
- `POST /api/predict`: predicción para dos equipos demo.
- `GET /api/fixtures`: fixtures desde Neon con predicción.
- `POST /api/import/world-cup`: importa fixtures del Mundial 2026 desde API-FootBALL y los guarda en Neon si `DATABASE_URL` existe.

## Siguiente fase del modelo

La versión actual es transparente y funciona con datos demo. El siguiente paso es reemplazar los datos demo por:

- rankings FIFA versionados por fecha;
- resultados históricos internacionales por selección;
- fixtures reales del Mundial 2026;
- calibración con backtesting: exact score, outcome y puntos esperados según las reglas de tu Polla.
