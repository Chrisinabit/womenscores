import { ArrowUpRight } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import HeaderQuickSearch from './components/HeaderQuickSearch'
import About from './pages/About'
import Advertise from './pages/Advertise'
import Competitions from './pages/Competitions'
import CompetitionDetail from './pages/CompetitionDetail'
import Home from './pages/Home'
import News from './pages/News'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import { brandName, policyRoutes } from './data/site'

const navigation = [
  { label: 'Scores', to: '/' },
  { label: 'Competitions', to: '/competitions/wsl' },
  { label: 'News', to: '/news' },
]

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-amber-300/15 bg-[#06291f]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-5 px-5 sm:h-[76px] sm:px-[5vw] lg:px-0">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-[13px] font-bold tracking-tight sm:text-lg"
          aria-label={`${brandName} home`}
        >
          <span className="grid size-7 shrink-0 rotate-[-7deg] place-items-center border border-amber-300 text-xs text-amber-300">W</span>
          <span className="whitespace-nowrap">
            <span className="hidden sm:inline">Women</span>
            <span className="text-amber-300">Live</span>Scores<span className="text-amber-300">.</span>
          </span>
        </Link>
        <nav className="flex h-full items-center gap-3 sm:gap-8" aria-label="Main navigation">
          {navigation.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `relative flex h-full items-center text-[11px] sm:text-sm ${isActive ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-300' : 'text-gray-400 transition-colors hover:text-white'}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <HeaderQuickSearch />
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl border-t border-emerald-100/15 px-5 py-6 text-[10px] text-gray-300 sm:px-[5vw] lg:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Site and legal information" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {policyRoutes.map(({ label, to }) => (
            <Link key={to} to={to} className="text-emerald-50/90 transition-colors hover:text-amber-300">
              {label}
            </Link>
          ))}
          <Link to="/news" className="inline-flex items-center gap-1 text-emerald-50/90 transition-colors hover:text-amber-300">
            The latest <ArrowUpRight size={12} />
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-3 text-gray-400">
          <span className="hidden sm:inline">For the game. By the game.</span>
          <span>© 2026 {brandName}</span>
        </div>
      </div>
      <p className="mt-4 max-w-3xl leading-5 text-gray-400">
        {brandName} is independent and unofficial — not affiliated with any league, club or broadcaster. Some links,
        including broadcast and shop links, are affiliate links and may earn us a commission at no extra cost to you.
        See our <Link to="/privacy-policy" className="text-emerald-50/90 underline underline-offset-2 transition-colors hover:text-amber-300">privacy policy</Link>.
      </p>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#061f18] bg-[radial-gradient(circle_at_73%_8%,rgba(16,185,129,.1),transparent_28rem)] text-white">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/competitions/:slug" element={<CompetitionDetail />} />
        <Route path="/news" element={<News />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/advertise" element={<Advertise />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  )
}
