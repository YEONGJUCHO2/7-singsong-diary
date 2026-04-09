'use client'

import { useAuth } from '@/components/auth/AuthProvider'

export function TopBar() {
  const { user, signOut } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
              <span className="text-label text-primary">
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          )}
          <span className="font-bold text-primary-container">싱송 다이어리</span>
        </div>

        <button
          onClick={signOut}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-primary transition-colors"
          aria-label="로그아웃"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>
      </div>
    </header>
  )
}
