import { Mail, ShieldCheck, Signal } from 'lucide-react'
import { Link } from 'react-router-dom'
import LegalSection from '../components/LegalSection'
import PageHeader from '../components/PageHeader'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { brandName, contactEmail } from '../data/site'

const coverage = [
  'Barclays Women’s Super League (WSL)',
  'National Women’s Soccer League (NWSL)',
  'UEFA Women’s Champions League',
  'Liga F (Spain)',
  'Frauen-Bundesliga (Germany)',
  'International tournaments and qualifiers',
]

const pillars = [
  {
    icon: Signal,
    title: 'Live, not delayed',
    body: 'Scores, lineups, events and statistics refresh automatically while matches are in progress.',
  },
  {
    icon: ShieldCheck,
    title: 'Independent',
    body: 'We are not affiliated with any league, club, broadcaster or federation. Every trademark stays with its owner.',
  },
  {
    icon: Mail,
    title: 'Corrections welcome',
    body: 'Spotted a wrong score or a broadcast listing that has moved? Tell us and we will fix it.',
  },
]

export default function About() {
  useDocumentTitle('About')

  return (
    <main className="mx-auto min-h-[calc(100vh-150px)] max-w-6xl px-5 pb-16 pt-12 sm:px-[5vw] sm:pt-16 lg:px-0">
      <PageHeader
        eyebrow="WHO WE ARE"
        title="About"
        lead={`${brandName} is an independent live scores site built for women's football. One place for scores, lineups, statistics, standings and where to watch the game.`}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="space-y-7 border border-emerald-400/15 bg-[#08281f]/60 p-6 sm:p-8">
          <LegalSection title="Why we exist">
            <p>
              Women&apos;s football has never had more competitions, more broadcasters or more supporters — but the
              information is scattered across league sites, broadcaster schedules, news feeds and social media. You end
              up with four tabs open to answer one question: what time is kick-off, and where can I watch it?
            </p>
            <p>
              {brandName} puts that information in one place, in the same format for every competition, so the WSL and
              Liga F are as easy to follow as the biggest men&apos;s leagues.
            </p>
          </LegalSection>

          <LegalSection title="What you will find">
            <ul>
              <li><strong>Live scores and results</strong> — including half-time and full-time scores, goalscorers and match events.</li>
              <li><strong>Match lineups</strong> — starting elevens, substitutions and squad numbers.</li>
              <li><strong>Match statistics</strong> — possession, shots, corners and other in-match numbers.</li>
              <li><strong>League standings</strong> — tables updated as results are confirmed.</li>
              <li><strong>TV and streaming listings</strong> — broadcast and streaming stations per fixture, by country.</li>
              <li><strong>Aggregated news</strong> — headlines from publishers with links to the original article.</li>
            </ul>
          </LegalSection>

          <LegalSection title="Competitions we cover">
            <p>
              Coverage follows our data provider and grows as competitions are added. It currently includes:
            </p>
            <ul>
              {coverage.map((competition) => (
                <li key={competition}>{competition}</li>
              ))}
            </ul>
            <p>
              Browse the full list on the <Link to="/competitions">competitions page</Link>, or open any match for
              lineups, statistics and broadcast details.
            </p>
          </LegalSection>

          <LegalSection title="How our data is sourced">
            <p>
              <strong>Live match data.</strong> Scores, lineups, events, statistics and standings come from a licensed
              third-party sports data provider (currently SportMonks). We display that feed as it arrives — we do not
              editorialise or adjust results. Data can be delayed, incomplete or briefly wrong when a provider has an
              outage, and we cannot guarantee that it is error-free.
            </p>
            <p>
              <strong>Broadcast listings.</strong> TV and streaming information is compiled from our data provider and
              publicly published broadcaster schedules. Rights change by territory and schedules are sometimes moved at
              short notice, so a listing can be out of date even when the match itself is correct. Always confirm with
              the broadcaster before you plan your evening.
            </p>
            <p>
              <strong>News.</strong> Article headlines and summaries are aggregated from the public RSS feeds of
              publishers such as BBC Sport and The Guardian. Each card links to the publisher&apos;s own page — we
              publish no full articles and claim no ownership of that work. Images shown on news cards are served from
              the publisher&apos;s own image URLs.
            </p>
            <p>
              <strong>Advertising and affiliate links.</strong> Some outbound links — including broadcast and shop links
              — may be affiliate links. If you buy or sign up after clicking one, we may earn a commission at no extra
              cost to you. See our <Link to="/privacy-policy">privacy policy</Link> for the cookies involved and our{' '}
              <Link to="/advertise">advertising page</Link> for how we work with partners.
            </p>
          </LegalSection>

          <LegalSection title="Editorial independence">
            <p>
              Advertising, sponsorship and affiliate revenue never influence scores, standings, rankings or which
              competitions we cover. Sponsored placements are always labelled, and they are never presented as
              editorial judgement. If a partner ever asks us to alter match data or coverage, the answer is no.
            </p>
          </LegalSection>

          <LegalSection title="Corrections and contact">
            <p>
              If something on the site is wrong — a score, a lineup, a broadcaster — email{' '}
              <a href={`mailto:${contactEmail}?subject=Correction%20request`}>{contactEmail}</a> with the match, the
              competition and a link if you have one. We aim to reply within two working days and to correct confirmed
              errors as soon as our data provider accepts the change.
            </p>
          </LegalSection>
        </article>

        <aside className="space-y-3">
          <div className="border border-emerald-400/15 bg-[#08281f]/75 p-5">
            <p className="text-[9px] font-bold tracking-[.16em] text-emerald-300">AT A GLANCE</p>
            <ul className="mt-4 space-y-4">
              {pillars.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <Icon size={16} className="mt-0.5 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-xs font-medium text-white">{title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-gray-400">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-amber-300/25 bg-amber-300/[.04] p-5">
            <p className="text-[9px] font-bold tracking-[.16em] text-amber-300">GET IN TOUCH</p>
            <p className="mt-3 text-[11px] leading-5 text-gray-400">
              Corrections, data questions, press or partnership enquiries.
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 transition-colors hover:text-amber-200"
            >
              <Mail size={13} /> {contactEmail}
            </a>
          </div>
        </aside>
      </div>
    </main>
  )
}
