import Parser from 'rss-parser'
import pool from '../db.js'

const feeds = [
  {
    url: 'https://feeds.bbci.co.uk/sport/football/womens/rss.xml',
    source: 'BBC Sport',
  },
  {
    url: 'https://www.theguardian.com/football/womensfootball/rss',
    source: 'The Guardian',
  },
]

const articleLimit = 100
const parser = new Parser({
  timeout: 20_000,
  headers: { 'User-Agent': 'womenscores RSS news cache' },
  customFields: {
    item: [
      ['media:thumbnail', 'media:thumbnail', { keepArray: true }],
      ['media:content', 'media:content', { keepArray: true }],
    ],
  },
})

let activeSync

function mediaEntries(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function mediaUrl(value) {
  if (typeof value === 'string') return value
  return value?.url || value?.$?.url || null
}

function mediaWidth(value) {
  if (typeof value === 'string') return 0
  const width = Number(value?.width || value?.$?.width)
  return Number.isFinite(width) ? width : 0
}

const imageExtension = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i

// Enclosures are often podcast audio, so they need positive proof that they are a
// picture. media:content and media:thumbnail are trusted unless they name audio or
// video, because some publishers serve images from extension-less URLs.
function isImageMedia(value, requireEvidence = false) {
  const type = typeof value === 'string' ? '' : String(value?.type || value?.$?.type || '').toLowerCase()
  if (type.startsWith('image/')) return true
  if (type.startsWith('audio/') || type.startsWith('video/')) return false

  const url = mediaUrl(value)
  if (!url) return false
  return imageExtension.test(url) || !requireEvidence
}

// Publishers expose the same photo at several sizes and the small variant (a 140px
// Guardian thumbnail or a 240px BBC thumbnail) looks soft once a card scales it up.
// BBC image paths carry the width, so ask for a card-sized copy instead.
function upgradeImageUrl(url) {
  if (!/^https:\/\/ichef\.bbci\.co\.uk\//i.test(url)) return url
  return url.replace(/\/(standard|news)\/\d+\//, '/$1/800/')
}

// Assumed width when a feed omits the attribute, so an unlabelled media:content
// still wins over a labelled 140px thumbnail.
const assumedWidth = { content: 620, thumbnail: 140, enclosure: 0 }

function imageUrl(item) {
  const candidates = [
    ...mediaEntries(item.enclosure)
      .filter((value) => isImageMedia(value, true))
      .map((value) => ({ url: mediaUrl(value), width: mediaWidth(value), kind: 'enclosure' })),
    ...mediaEntries(item['media:content'])
      .filter((value) => isImageMedia(value))
      .map((value) => ({ url: mediaUrl(value), width: mediaWidth(value), kind: 'content' })),
    ...mediaEntries(item['media:thumbnail'])
      .filter((value) => isImageMedia(value))
      .map((value) => ({ url: mediaUrl(value), width: mediaWidth(value), kind: 'thumbnail' })),
  ]
    .filter((candidate) => candidate.url)
    .map((candidate) => ({
      ...candidate,
      score: candidate.width || assumedWidth[candidate.kind],
    }))
    .sort((left, right) => right.score - left.score)

  const url = candidates[0]?.url
  return url ? upgradeImageUrl(url) : null
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function summaryText(item) {
  const rawSummary = item.contentSnippet || item.summary || item.content || item.description || ''
  const plainText = decodeHtmlEntities(String(rawSummary))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plainText.length <= 280) return plainText || null
  return `${plainText.slice(0, 277).trimEnd()}...`
}

function articleFromItem(item, source) {
  const articleUrl = item.link?.trim()
  const title = item.title?.trim()
  const guid = String(item.guid || item.id || articleUrl || '').trim()
  const publishedAt = new Date(item.isoDate || item.pubDate || '')

  if (!articleUrl || !title || !guid || Number.isNaN(publishedAt.getTime())) {
    console.warn(`[newsSync] Skipping invalid RSS item from ${source}`)
    return null
  }

  return {
    guid,
    title,
    summary: summaryText(item),
    articleUrl,
    imageUrl: imageUrl(item),
    source,
    publishedAt: publishedAt.toISOString(),
  }
}

async function fetchFeed(feed) {
  const parsedFeed = await parser.parseURL(feed.url)
  return (parsedFeed.items || [])
    .map((item) => articleFromItem(item, feed.source))
    .filter(Boolean)
}

async function persistArticles(articles) {
  let upserted = 0

  for (const article of articles) {
    await pool.query(
      `
        INSERT INTO news_articles (
          guid, title, summary, article_url, image_url, source, published_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (guid) DO UPDATE
        SET title = EXCLUDED.title,
            summary = EXCLUDED.summary,
            article_url = EXCLUDED.article_url,
            image_url = EXCLUDED.image_url,
            source = EXCLUDED.source,
            published_at = EXCLUDED.published_at
      `,
      [
        article.guid,
        article.title,
        article.summary,
        article.articleUrl,
        article.imageUrl,
        article.source,
        article.publishedAt,
      ],
    )
    upserted += 1
  }

  await pool.query(
    `
      DELETE FROM news_articles
      WHERE id NOT IN (
        SELECT id
        FROM news_articles
        ORDER BY published_at DESC, id DESC
        LIMIT $1
      )
    `,
    [articleLimit],
  )

  return upserted
}

export function syncNewsFeeds() {
  if (activeSync) return activeSync

  activeSync = (async () => {
    const results = await Promise.allSettled(feeds.map(fetchFeed))
    const articles = []
    const failures = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        articles.push(...result.value)
      } else {
        const message = result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
        failures.push(`${feeds[index].source}: ${message}`)
        console.error(`[newsSync] Could not fetch ${feeds[index].source} RSS feed:`, result.reason)
      }
    })

    if (failures.length === feeds.length) {
      throw new Error(`Could not sync any news feeds: ${failures.join('; ')}`)
    }

    const upserted = await persistArticles(articles)
    const result = {
      feeds: feeds.length - failures.length,
      articles: articles.length,
      upserted,
      failures,
    }
    console.log(`[newsSync] Cached ${upserted} articles from ${result.feeds} feeds`)
    return result
  })().finally(() => {
    activeSync = null
  })

  return activeSync
}
