# womenscores backend

## Setup

Set the database credentials and `SPORTMONKS_API_TOKEN` in `.env`, then install dependencies with `npm install`.

Apply the database migrations before starting the server:

```powershell
npm run db:migrate
```

The migrations add Sportmonks-specific ID columns and a current season ID while preserving existing local IDs and API-Football/sample rows. Those legacy rows remain in the database but are excluded from API responses. Migration 004 adds match detail JSONB fields, Sportmonks-ID-keyed players/events/lineups, season player statistics, and poll vote counts. The migrations also create the indexes needed for upserts and synchronize local ID sequences. If `standings` already has duplicate `(league_id, team_id)` pairs, reconcile them before applying migration 001.

Start the API and five-minute live-fixture job with:

```powershell
npm run dev
```

## Sync behavior

- `POST /api/sync` and `POST /api/sync/enrich` discover leagues available to your token from `GET /leagues?include=currentSeason;country`, follow cursor pagination, and whitelist the requested women's competitions. League and current-season IDs are stored in the database.
- On startup and for either manual sync endpoint, the service imports standings, top scorers/assists, and fixtures from 14 days ago through 14 days ahead. The fixtures-by-date endpoint returns a single date, so the service requests each date with a filter for the selected league IDs.
- Fixture sync requests `participants;scores;venue;referees;events;lineups;statistics.type;tvstations.tvstation`. If the combined optional includes are rejected, the service retries each optional include independently so one restricted include does not prevent event or lineup upserts. Sync logs report the upserted enriched-match, event, lineup, and top-scorer counts.
- Sportmonks event type IDs are normalized to readable event names. After fixture enrichment, current-season player totals are recalculated from played-match events and lineups without reducing higher provider totals.
- The cron job requests in-play livescores every five minutes. Repeated in-play API calls are cached in memory for 20 seconds to coalesce duplicate requests. A server restart clears that cache.
- API requests are serialized with a default one-second minimum interval. Set `SPORTMONKS_MIN_INTERVAL_MS` to match your subscription limits.
- In development, the manual endpoint is available without a token. In production, set `SYNC_API_SECRET` and send `Authorization: Bearer <secret>`; if it is unset, the endpoint is disabled.

## Match detail endpoints

- `GET /api/matches/:id` returns match metadata, events, home/away lineups, statistics, broadcast stations, and poll totals. The `:id` is the local match ID returned by `GET /api/matches`.
- `GET /api/leagues/:id/leaders` returns the current season's top scorers and assist leaders.
- `GET /api/search?q=<text>` searches synced club and player names.
- `POST /api/matches/:id/vote` accepts `{ "choice": "home" | "draw" | "away" }` and atomically increments that match's public vote count. Votes are currently anonymous and are not deduplicated.

Example development request:

```powershell
Invoke-RestMethod -Method Post http://localhost:3000/api/sync
```

Never commit `.env` or expose the Sportmonks token in frontend code.
