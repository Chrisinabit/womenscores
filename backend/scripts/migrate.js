import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import pool from '../db.js'

try {
  const migrationFiles = [
    '../migrations/000_create_base_schema.sql',
    '../migrations/001_add_api_football_ids.sql',
    '../migrations/002_sync_id_sequences.sql',
    '../migrations/003_add_sportmonks_ids.sql',
    '../migrations/004_add_match_details_and_player_stats.sql',
    '../migrations/005_relax_legacy_match_event_type.sql',
    '../migrations/006_add_lineup_player_name.sql',
    '../migrations/007_player_season_stats_unique_key.sql',
    '../migrations/008_create_news_articles.sql',
  ]

  for (const migrationFile of migrationFiles) {
    const migration = await readFile(new URL(migrationFile, import.meta.url), 'utf8')
    await pool.query(migration)
    console.log(`Applied ${migrationFile}`)
  }

  console.log('Database migrations completed')
} catch (error) {
  console.error('Database migration failed:', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
