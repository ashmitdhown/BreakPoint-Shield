import { Link, useLocation } from 'react-router-dom'
import { Shield, Clock, Github } from 'lucide-react'

export default function NavBar() {
  const { pathname } = useLocation()

  const navLinks = [
    { to: '/', label: 'Evaluate' },
    { to: '/history', label: 'History' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-surface-800/80 bg-surface-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Shield size={14} className="text-accent" />
          </div>
          <span className="font-mono font-bold text-surface-100 tracking-tight">
            Red<span className="text-accent">Team</span>
          </span>
          <span className="text-xs font-mono text-surface-600 hidden sm:block">v2.0</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === link.to
                  ? 'text-surface-100 bg-surface-800'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="w-px h-4 bg-surface-800 mx-2" />

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost px-2.5 py-1.5"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
        </nav>
      </div>
    </header>
  )
}
