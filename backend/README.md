# womenscores backend

## Setup

Set the database credentials and `SPORTMONKS_API_TOKEN` in `.env`, then install dependencies with `npm install`.

Apply the database migrations before starting the server:

```powershell
npm run db:migrate
```

The migrations add Sportmonks-specific ID columns and a current season ID while preserving existing local IDs and API-Football/sample rows. Those legacy rows remain in the database but are excluded from API responses. The migrations also create the indexes needed for upserts and synchronize local ID sequences. If `standings` already has duplicate `(league_id, team_id)` pairs, reconcile them before applying migration 001.

Start the API and five-minute live-fixture job with:

```powershell
npm run dev
```

## Sync behavior

- `POST /api/sync` discovers leagues available to your token from `GET /leagues?include=currentSeason;country`, follows cursor pagination, and whitelists the requested women's competitions. League and current-season IDs are stored in the database.
- A full sync imports standings and fixtures for the next 14 days. The fixtures-by-date endpoint returns a single date, so the service requests each date with a filter for the selected league IDs. Set `UPCOMING_FIXTURE_DAYS` to a value from 1 to 30.
- The cron job requests in-play livescores every five minutes. Repeated in-play API calls are cached in memory for 20 seconds to coalesce duplicate requests. A server restart clears that cache.
- API requests are serialized with a default one-second minimum interval. Set `SPORTMONKS_MIN_INTERVAL_MS` to match your subscription limits.
- In development, the manual endpoint is available without a token. In production, set `SYNC_API_SECRET` and send `Authorization: Bearer <secret>`; if it is unset, the endpoint is disabled.

Example development request:

```powershell
Invoke-RestMethod -Method Post http://localhost:3000/api/sync
```

Never commit `.env` or expose the Sportmonks token in frontend code.
