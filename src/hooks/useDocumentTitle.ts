import { useEffect } from 'react'
import { brandName } from '../data/site'

/**
 * Sets the document title for the current route as "<title> · WomenLiveScores".
 * Every routed page calls this so crawlers see a distinct title per URL instead
 * of the single static title in index.html.
 */
export default function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · ${brandName}`
  }, [title])
}
