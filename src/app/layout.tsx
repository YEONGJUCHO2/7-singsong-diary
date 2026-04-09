import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '싱송 다이어리',
  description: '일기를 쓰면, 음악이 됩니다',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="ko" className={manrope.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="font-manrope bg-surface text-on-surface min-h-screen">
        <AuthProvider initialUser={user}>
          {user && <TopBar />}
          <main className={user ? 'pt-14 pb-16' : ''}>
            {children}
          </main>
          {user && <BottomNav />}
        </AuthProvider>
      </body>
    </html>
  )
}
