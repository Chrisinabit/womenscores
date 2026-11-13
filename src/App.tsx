import { ArrowUpRight, Search } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Competitions from './pages/Competitions'
import CompetitionDetail from './pages/CompetitionDetail'
import Home from './pages/Home'
import News from './pages/News'

const navigation = [
  { label: 'Scores', to: '/' },
  { label: 'Competitions', to: '/competitions/wsl' },
  { label: 'News', to: '/news' },
]

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-amber-300/15 bg-[#06291f]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-5 px-5 sm:h-[76px] sm:px-[5vw] lg:px-0">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-base font-bold tracking-tight sm:text-lg" aria-label="womenscores home">
          <span className="grid size-7 rotate-[-7deg] place-items-center border border-amber-300 text-xs text-amber-300">W</span>
          <span>womenscores<span className="text-amber-300">.</span></span>
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
        <button className="hidden text-gray-300 transition-colors hover:text-amber-300 sm:block" aria-label="Search">
          <Search size={19} strokeWidth={1.7} />
        </button>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t border-gray-400/10 px-5 py-5 text-[10px] text-gray-500 sm:px-[5vw] lg:px-0">
      <span>© 2026 womenscores</span>
      <span className="hidden sm:inline">For the game. By the game.</span>
      <Link to="/news" className="inline-flex items-center gap-1 transition-colors hover:text-amber-300">
        The latest <ArrowUpRight size={12} />
      </Link>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  )
}
