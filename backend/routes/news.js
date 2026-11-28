import { Router } from 'express'
import pool from '../db.js'
import { syncNewsFeeds } from '../services/newsSync.js'

const router = Router()
const defaultLimit = 24
const maximumLimit = 50
const newsSources = new Set(['BBC Sport', 'The Guardian'])

router.get('/', async (request, response, next) => {
  const rawLimit = request.query.limit
  let limit = defaultLimit
  if (rawLimit !== undefined) {
    const parsedLimit = Number(rawLimit)
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      response.status(400).json({ error: 'limit must be a positive integer' })
      return
    }
    limit = Math.min(parsedLimit, maximumLimit)
  }

  const source = request.query.source
  if (source !== undefined && (typeof source !== 'string' || !newsSources.has(source))) {
    response.status(400).json({ error: 'source must be BBC Sport or The Guardian' })
    return
  }

  try {
    const { rows } = await pool.query(
      `
        SELECT
          id,
          guid,
          title,
          summary,
          article_url,
          image_url,
          source,
          published_at,
          created_at
        FROM news_articles
        WHERE ($2::text IS NULL OR source = $2)
        ORDER BY published_at DESC, id DESC
        LIMIT $1
      `,
      [limit, source || null],
    )

    response.json({ articles: rows })
  } catch (error) {
    next(error)
  }
})

router.post('/sync', async (_request, response, next) => {
  try {
    const result = await syncNewsFeeds()
    response.json({ message: 'News feed sync completed', ...result })
  } catch (error) {
    next(error)
  }
})

export default router
