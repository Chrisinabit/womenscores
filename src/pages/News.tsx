import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, Newspaper } from 'lucide-react'
import { getNews, type ApiNewsArticle } from '../api'
import useDocumentTitle from '../hooks/useDocumentTitle'

const bbcImagePath = /\/(standard|news)\/\d+\//
const bbcImageHost = /^https:\/\/ichef\.bbci\.co\.uk\//i

// BBC "thumbnails" are 240px wide, which blurs badly once a card scales them up.
// Their paths carry the width, so ask for a card-sized copy and step back to the
// sizes the feed shipped if that one is unavailable.
function imageSources(url: string) {
  if (!bbcImageHost.test(url)) return [url]
  const at = (width: number) => url.replace(bbcImagePath, `/$1/${width}/`)
  return [...new Set([at(800), url, at(240)])]
}

const sources = ['All sources', 'BBC Sport', 'The Guardian'] as const
type NewsSource = typeof sources[number]

function formatPublishedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function NewsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading news" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="min-h-72 animate-pulse border border-emerald-400/15 bg-[#08281f]/75 p-5 sm:p-6">
          <div className="-mx-5 -mt-5 aspect-[16/10] bg-emerald-100/[.06] sm:-mx-6 sm:-mt-6" />
          <div className="mt-5 h-2 w-24 rounded bg-emerald-100/[.08]" />
          <div className="mt-4 h-5 w-4/5 rounded bg-emerald-100/[.08]" />
          <div className="mt-2 h-5 w-3/5 rounded bg-emerald-100/[.08]" />
          <div className="mt-4 h-3 w-full rounded bg-emerald-100/[.06]" />
          <div className="mt-2 h-3 w-2/3 rounded bg-emerald-100/[.06]" />
        </div>
      ))}
    </div>
  )
}

function NewsImage({ src }: { src: string }) {
  const candidates = useMemo(() => imageSources(src), [src])
  const [attempt, setAttempt] = useState(0)

  if (attempt >= candidates.length) return null

  return (
    <img
      src={candidates[attempt]}
      alt=""
      loading="lazy"
      decoding="async"
      className="absolute inset-0 size-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
      onError={() => setAttempt((current) => current + 1)}
    />
  )
}

function NewsCard({ article, index }: { article: ApiNewsArticle; index: number }) {
  return (
    <article className="flex min-h-72 flex-col overflow-hidden border border-emerald-400/15 bg-[#08281f]/75 transition-colors hover:border-emerald-300/30">
      <a
        href={article.article_url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Read ${article.title} on ${article.source}`}
        className="group relative grid aspect-[16/10] w-full shrink-0 place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,rgba(16,185,129,.2),transparent_70%),#06291f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
      >
        <Newspaper size={34} strokeWidth={1} className="text-emerald-100/25" />
        {article.image_url ? <NewsImage key={article.image_url} src={article.image_url} /> : null}
        <span className="absolute bottom-3 left-3 bg-[#061f18]/85 px-2.5 py-1 text-[9px] font-bold tracking-[.12em] text-emerald-200">
          {article.source}
        </span>
        <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[#061f18]/75 text-amber-300 opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight size={16} />
        </span>
      </a>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] font-bold tracking-[.17em] text-emerald-300">{article.source}</span>
          <span className="text-[10px] text-gray-600">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <h2 className="mt-5 text-lg font-medium leading-snug tracking-tight text-white sm:text-xl">
          <a
            href={article.article_url}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer transition-colors hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            {article.title}
          </a>
        </h2>
        {article.summary && <p className="mt-3 text-xs leading-6 text-gray-400">{article.summary}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/5 pt-4 text-[10px] text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={12} />{formatPublishedAt(article.published_at)}
          </span>
          <a
            href={article.article_url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Read ${article.title} on ${article.source}`}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-amber-300 transition-colors hover:text-amber-200"
          >
            Read article <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </article>
  )
}

export default function News() {
  useDocumentTitle('News')

  const [selectedSource, setSelectedSource] = useState<NewsSource>('All sources')
  const [articles, setArticles] = useState<ApiNewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    setArticles([])

    getNews(50, selectedSource === 'All sources' ? undefined : selectedSource, controller.signal)
      .then(({ articles: loadedArticles }) => setArticles(loadedArticles))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Unable to load news')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [selectedSource, refreshKey])

  return (
    <main className="mx-auto min-h-[calc(100vh-150px)] max-w-6xl px-5 pb-16 pt-12 sm:px-[5vw] sm:pt-16 lg:px-0">
      <p className="mb-3 text-[10px] font-extrabold tracking-[.2em] text-emerald-300">THE LATEST FROM THE GAME</p>
      <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">News<span className="text-amber-300">.</span></h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400">Stories, perspectives and talking points from across women&apos;s football.</p>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter news by source">
        {sources.map((source) => (
          <button
            key={source}
            type="button"
            aria-pressed={selectedSource === source}
            onClick={() => setSelectedSource(source)}
            className={`shrink-0 cursor-pointer border px-3 py-2 text-[10px] font-semibold transition-colors ${
              selectedSource === source
                ? 'border-amber-300/50 bg-amber-300/10 text-amber-200'
                : 'border-emerald-100/10 text-gray-400 hover:border-emerald-300/30 hover:text-white'
            }`}
          >
            {source}
          </button>
        ))}
      </div>

      <section className="mt-5" aria-label="Latest women's football news" aria-busy={loading}>
        {loadError && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-xs text-rose-200">
            <span>Could not load news: {loadError}</span>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="cursor-pointer font-semibold text-amber-200 underline underline-offset-2 hover:text-amber-100"
            >
              Try again
            </button>
          </div>
        )}
        {loading ? (
          <NewsSkeleton />
        ) : articles.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <NewsCard key={article.guid} article={article} index={index} />
            ))}
          </div>
        ) : !loadError ? (
          <div className="border border-emerald-400/15 bg-[#08281f]/70 px-5 py-12 text-center">
            <Newspaper size={24} className="mx-auto text-amber-300" />
            <h2 className="mt-3 text-sm font-medium text-white">No news articles available</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-400">
              The news cache is empty right now. Try again after the backend has synced its RSS feeds.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  )
}
