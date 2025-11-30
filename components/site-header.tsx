'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/profile', label: 'Profile' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About Us' },
]

export function SiteHeader() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-transparent bg-white/80 backdrop-blur dark:bg-slate-950/80">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          ABA Forecast
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full px-4 py-2 font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Link href="/assessment">Start Assessment</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
