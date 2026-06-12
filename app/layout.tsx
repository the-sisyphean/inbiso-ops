import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Inbiso Ops',
  description: 'Project Operations Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-950 text-white">
          <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Inbiso" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />                <span className="font-semibold text-lg">Inbiso Ops</span>
                <span className="text-xs text-gray-500 ml-1">Fire Safety Systems</span>
              </div>
              <div className="flex gap-1">
                <Link href="/projects" className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Projects</Link>
                <Link href="/manpower" className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Manpower</Link>
                <Link href="/cashflow" className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cashflow</Link>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
