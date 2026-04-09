'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', icon: 'home', label: '메인' },
  { href: '/history', icon: 'history', label: '지난 기록' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-center gap-2">
        {tabs.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-semibold'
                  : 'text-primary/50 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{tab.icon}</span>
              <span className="text-sm">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
