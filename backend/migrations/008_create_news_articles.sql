BEGIN;

CREATE TABLE IF NOT EXISTS news_articles (
  id SERIAL PRIMARY KEY,
  guid TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  article_url TEXT NOT NULL,
  image_url TEXT,
  source VARCHAR(100) NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS news_articles_published_at_idx
  ON news_articles (published_at DESC);

COMMIT;
