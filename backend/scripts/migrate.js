import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import pool from '../db.js'

try {
  const migrationFiles = [
    '../migrations/000_create_base_schema.sql',
    '../migrations/001_add_api_football_ids.sql',
    '../migrations/002_sync_id_sequences.sql',
    '../migrations/003_add_sportmonks_ids.sql',
  ]

  for (const migrationFile of migrationFiles) {
    const migration = await readFile(new URL(migrationFile, import.meta.url), 'utf8')
    await pool.query(migration)
    console.log(`Applied ${migrationFile}`)
  }

  console.log('Database migrations completed')
} catch (error) {
  console.error('API-Football database migration failed:', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
