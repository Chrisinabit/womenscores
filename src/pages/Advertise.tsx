import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, Copy, Mail, Megaphone, Sparkles, Tv } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { brandName, contactEmail, siteDomain } from '../data/site'

const placements = [
  {
    icon: Megaphone,
    slot: '01',
    title: 'Header / League Bar Banner',
    body: 'A persistent slot in the site header and league selector, seen on every page and every competition switch. Best for brands that want broad, repeated visibility through the season.',
    detail: 'Leaderboard or responsive display unit',
  },
  {
    icon: Tv,
    slot: '02',
    title: 'Match Centre Sponsorship',
    body: 'Own the Where to Watch area inside the match centre, alongside the broadcast and streaming badges. This is the highest-intent moment on the site: a supporter has picked a fixture and is working out how to watch it.',
    detail: 'Broadcast “Where to Watch” placement',
  },
  {
    icon: Sparkles,
    slot: '03',
    title: 'Newsletter / Matchday Spotlight',
    body: 'One sponsor per matchday, featured in the matchday feed as supporters plan their weekend. Newsletter placements open as the list grows, and are capped at one partner per send.',
    detail: 'Single sponsor, single send',
  },
]

const audience = [
  'Supporters following the WSL, NWSL, UEFA Women’s Champions League, Liga F and Frauen-Bundesliga',
  'Matchday traffic — people checking kick-off times, lineups and where to watch, not casual scrolls',
  'An audience that already converts on broadcast, ticket, streaming and kit purchases',
  'Readers across the UK, US, Spain, Germany and the wider women’s football community',
]

const steps = [
  { step: '01', title: 'Tell us your goal', body: 'Awareness, app installs, subscriptions or kit sales — we will suggest the placement that fits.' },
  { step: '02', title: 'We send a simple proposal', body: 'Placement, dates, format and a flat rate. No long media kit, no minimum spend.' },
  { step: '03', title: 'You get a labelled slot', body: 'Sponsored placements are always marked, and we report back on impressions and clicks after the campaign.' },
]

function CopyEmailButton() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timeout = window.setTimeout(() => setState('idle'), 2400)
    return () => window.clearTimeout(timeout)
  }, [state])

  async function copy() {
    try {
      await navigator.clipboard.writeText(contactEmail)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex cursor-pointer items-center gap-1.5 border border-emerald-100/10 px-3 py-2 text-[10px] font-semibold text-gray-300 transition-colors hover:border-amber-300/40 hover:text-amber-200"
      aria-live="polite"
    >
      {state === 'copied' ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Select the address above' : 'Copy email'}
    </button>
  )
}

export default function Advertise() {
  useDocumentTitle('Advertise')

  const [form, setForm] = useState({ name: '', company: '', email: '', message: '' })

  function update(field: keyof typeof form) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const subject = `Advertising enquiry — ${form.company || form.name || brandName}`
    const body = [
      `Name: ${form.name}`,
      `Company: ${form.company}`,
      `Email: ${form.email}`,
      '',
      form.message,
    ].join('\n')

    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-150px)] max-w-6xl px-5 pb-16 pt-12 sm:px-[5vw] sm:pt-16 lg:px-0">
      <PageHeader
        eyebrow="PARTNER WITH US"
        title="Advertise"
        lead="Reach supporters at the moment they are deciding how to watch women's football. Matchday placements for broadcasters, brands, podcasts and apparel."
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${contactEmail}?subject=Advertising%20enquiry`}
          className="inline-flex items-center gap-2 bg-amber-300 px-4 py-2.5 text-[11px] font-bold tracking-[.06em] text-[#061f18] transition-colors hover:bg-amber-200"
        >
          <Mail size={14} /> Start a conversation
        </a>
        <span className="text-[10px] tracking-[.12em] text-gray-500">FLAT RATE · NO MINIMUM SPEND</span>
      </div>

      <section className="mt-12" aria-label="Available placements">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-medium sm:text-xl">Available placements</h2>
          <span className="text-[10px] tracking-[.14em] text-gray-500">SEASONAL · ONE PARTNER PER SLOT</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {placements.map(({ icon: Icon, slot, title, body, detail }) => (
            <article
              key={slot}
              className="group flex flex-col border border-emerald-400/15 bg-[#08281f]/75 p-5 transition-colors hover:border-amber-300/40 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center border border-amber-300/30 bg-amber-300/5 text-amber-300">
                  <Icon size={17} />
                </span>
                <span className="text-[9px] tracking-[.16em] text-gray-500">{slot}</span>
              </div>
              <h3 className="mt-6 text-base font-medium">{title}</h3>
              <p className="mt-3 flex-1 text-xs leading-6 text-gray-400">{body}</p>
              <p className="mt-5 border-t border-white/5 pt-4 text-[10px] tracking-[.1em] text-emerald-300">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-12 grid gap-3 lg:grid-cols-2">
        <section className="border border-emerald-400/15 bg-[#08281f]/60 p-6 sm:p-8" aria-label="Who we reach">
          <p className="text-[9px] font-bold tracking-[.16em] text-emerald-300">WHO WE REACH</p>
          <h2 className="mt-4 text-lg font-medium">Supporters, not drive-by traffic</h2>
          <ul className="mt-5 space-y-3">
            {audience.map((item) => (
              <li key={item} className="flex gap-2.5 text-xs leading-6 text-gray-400">
                <Check size={13} className="mt-1 shrink-0 text-amber-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-emerald-400/15 bg-[#08281f]/60 p-6 sm:p-8" aria-label="How it works">
          <p className="text-[9px] font-bold tracking-[.16em] text-emerald-300">HOW IT WORKS</p>
          <h2 className="mt-4 text-lg font-medium">Three steps, one week</h2>
          <ol className="mt-5 space-y-4">
            {steps.map(({ step, title, body }) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 text-[10px] font-bold tracking-[.12em] text-amber-300">{step}</span>
                <div>
                  <p className="text-xs font-medium text-white">{title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-gray-400">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section
        id="enquire"
        className="mt-12 border border-amber-300/25 bg-amber-300/[.03] p-6 sm:p-8"
        aria-label="Advertising enquiry"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-[9px] font-bold tracking-[.16em] text-amber-300">GET IN TOUCH</p>
              <h2 className="mt-3 text-lg font-medium sm:text-xl">Tell us what you have in mind</h2>
              <p className="mt-2 max-w-xl text-xs leading-6 text-gray-400">
                This form opens your email app with the details filled in — no account, no data stored on our side.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-bold tracking-[.14em] text-emerald-300">YOUR NAME</span>
                <input
                  value={form.name}
                  onChange={update('name')}
                  required
                  autoComplete="name"
                  className="mt-2 w-full border border-emerald-100/10 bg-[#061f18]/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-amber-300/50 focus:outline-none"
                  placeholder="Alex Morgan"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold tracking-[.14em] text-emerald-300">COMPANY</span>
                <input
                  value={form.company}
                  onChange={update('company')}
                  autoComplete="organization"
                  className="mt-2 w-full border border-emerald-100/10 bg-[#061f18]/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-amber-300/50 focus:outline-none"
                  placeholder="Brand or show name"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold tracking-[.14em] text-emerald-300">EMAIL</span>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                autoComplete="email"
                className="mt-2 w-full border border-emerald-100/10 bg-[#061f18]/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-amber-300/50 focus:outline-none"
                placeholder="you@company.com"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold tracking-[.14em] text-emerald-300">WHAT ARE YOU PLANNING?</span>
              <textarea
                value={form.message}
                onChange={update('message')}
                required
                rows={4}
                className="mt-2 w-full resize-y border border-emerald-100/10 bg-[#061f18]/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-amber-300/50 focus:outline-none"
                placeholder="Placement, dates, budget range or campaign goal"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-2 bg-amber-300 px-4 py-2.5 text-[11px] font-bold tracking-[.06em] text-[#061f18] transition-colors hover:bg-amber-200"
              >
                <Mail size={14} /> Send enquiry
              </button>
              <a href={`mailto:${contactEmail}`} className="text-[11px] text-gray-400 underline underline-offset-2 transition-colors hover:text-amber-200">
                or email directly
              </a>
            </div>
          </form>

          <aside className="border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-[9px] font-bold tracking-[.16em] text-emerald-300">DIRECT LINE</p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-3 block break-all text-sm text-white transition-colors hover:text-amber-200"
            >
              {contactEmail}
            </a>
            <p className="mt-1 text-[10px] tracking-[.08em] text-gray-500">{siteDomain}</p>
            <div className="mt-4">
              <CopyEmailButton />
            </div>
            <p className="mt-6 text-[11px] leading-6 text-gray-400">
              We answer every enquiry within two working days. Media kits, audience breakdowns and past campaign
              numbers are available on request.
            </p>
            <p className="mt-4 border-t border-white/5 pt-4 text-[10px] leading-5 text-gray-500">
              Sponsored content is always labelled. Advertising never influences scores, standings or which
              competitions we cover.
            </p>
          </aside>
        </div>
      </section>
    </main>
  )
}
