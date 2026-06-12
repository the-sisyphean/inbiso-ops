'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const nav = [
  { href: '/projects', label: 'Projects', icon: '⬡' },
  { href: '/manpower', label: 'Manpower', icon: '◈' },
  { href: '/cashflow', label: 'Cashflow', icon: '◎' },
  { href: '/referrals', label: 'Referrals', icon: '◇' },
]

function ThemeToggle() {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])
  return (
    <button
      onClick={() => setDark(!dark)}
      style={{
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '7px 10px',
        cursor: 'pointer',
        color: 'var(--text-2)',
        fontSize: '14px',
        transition: 'background 0.15s',
      }}
      title={dark ? 'Switch to light' : 'Switch to dark'}
    >
      {dark ? '☀' : '◑'}
    </button>
  )
}

function NavContent() {
  const pathname = usePathname()
  return (
    <nav style={{
      background: 'var(--bg-2)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img src="/logo.png" alt="Inbiso" style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--text)' }}>Inbiso Ops</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: -1 }}>Fire Safety Systems</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {nav.map(n => (
            <Link key={n.href} href={n.href} className={`nav-link ${pathname === n.href ? 'active' : ''}`}>
              <span style={{ fontSize: 12 }}>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
          }}>G</div>
        </div>
      </div>
    </nav>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <title>Inbiso Ops</title>
        <meta name="description" content="Project Operations Dashboard — Inbiso Fire Safety Systems" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NavContent />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
