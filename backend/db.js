import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
const missingEnv = requiredEnv.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
  throw new Error(`Missing required database environment variables: ${missingEnv.join(', ')}`)
}

const port = Number(process.env.DB_PORT || 5432)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be an integer between 1 and 65535')
}

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port,
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error)
})

export default pool
