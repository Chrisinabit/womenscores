import { ArrowUpRight, Clock3 } from 'lucide-react'

const stories = [
  { category: 'EUROPE', title: 'The race for a place in the Champions League knockout rounds', summary: 'Every point matters as the group-stage story begins to take shape.', time: '5 min read' },
  { category: 'ENGLAND', title: 'A new generation is making its mark in the WSL', summary: 'Young talent is changing the pace and possibilities of the season.', time: '4 min read' },
  { category: 'THE GAME', title: 'The moments, players and matches to watch this week', summary: 'Our weekly guide to the fixtures worth making time for.', time: '3 min read' },
]

export default function News() {
  return (
    <main className="mx-auto min-h-[calc(100vh-150px)] max-w-6xl px-5 pb-16 pt-12 sm:px-[5vw] sm:pt-16 lg:px-0">
      <p className="mb-3 text-[10px] font-extrabold tracking-[.2em] text-emerald-300">THE LATEST FROM THE GAME</p>
      <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">News<span className="text-amber-300">.</span></h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400">Stories, perspectives and talking points from across women&apos;s football.</p>

      <section className="mt-10 grid gap-3 lg:grid-cols-3" aria-label="Latest women's football news">
        {stories.map((story, index) => (
          <article key={story.title} className="flex min-h-64 flex-col border border-emerald-400/15 bg-[#08281f]/75 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-[.17em] text-emerald-300">{story.category}</span>
              <span className="text-[10px] text-gray-600">0{index + 1}</span>
            </div>
            <h2 className="mt-8 text-xl font-medium leading-snug tracking-tight">{story.title}</h2>
            <p className="mt-3 text-xs leading-6 text-gray-400">{story.summary}</p>
            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-5">
              <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-500"><Clock3 size={12} />{story.time}</span>
              <button type="button" aria-label={`Read ${story.title}`} className="text-amber-300 transition-colors hover:text-amber-200"><ArrowUpRight size={16} /></button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
