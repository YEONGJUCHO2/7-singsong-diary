# SingSong Diary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일기를 쓰면 AI가 30초 음악을 만들어주는 웹앱 — 로그인, 일기 작성, 음악 생성, 재생, 히스토리 전체 플로우 구현

**Architecture:** Next.js 15 App Router 기반 풀스택 앱. Supabase Auth(Google OAuth)로 인증, Supabase PostgreSQL로 데이터 저장, Supabase Storage로 음악 파일 저장. 음악 생성은 Suno API를 추상화한 모듈로 처리. 클라이언트는 Supabase Realtime으로 생성 상태를 구독. DESIGN.md의 앰버/골드 "Resonant Monolith" 디자인 시스템 적용.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS, Supabase (Auth + PostgreSQL + Storage + Realtime), Suno API, Vitest + Testing Library, Vercel

**Design Reference:** `DESIGN.md` (앰버/골드 팔레트, Manrope 폰트, 글래스모피즘, No-Line Rule), `stitch_ai/` (화면별 HTML 목업)

---

## File Structure

```
src/
  app/
    layout.tsx                      # Root layout — Manrope 폰트, 글로벌 스타일, AuthProvider
    page.tsx                        # 메인 (일기 작성) — 로그인 안 됐으면 /login 리다이렉트
    login/page.tsx                  # 로그인 페이지
    auth/callback/route.ts          # Supabase OAuth 콜백 핸들러
    generation/[id]/page.tsx        # 생성 상태 페이지 (pending/generating/completed/failed)
    history/page.tsx                # 히스토리 (지난 기록)
    api/generate/[id]/route.ts      # 음악 생성 트리거 API
  components/
    layout/TopBar.tsx               # 상단 바 — 글래스모피즘, 유저 아바타, 로그아웃
    layout/BottomNav.tsx            # 하단 네비게이션 — 2탭 (메인/지난 기록)
    diary/DiaryForm.tsx             # 일기 작성 폼 + 제출 버튼
    diary/MusicOptions.tsx          # 5개 옵션 그룹 칩 UI
    diary/DiaryCard.tsx             # 일기 카드 (읽기 전용)
    music/MusicPlayer.tsx           # 웨이브폼 + 재생/일시정지 + 시간 + 다운로드
    music/WaveformAnimation.tsx     # 앰버 웨이브폼 로딩 애니메이션
    music/StatusDot.tsx             # 상태 표시 도트 (8px 원 + 텍스트)
    history/HistoryCard.tsx         # 히스토리 카드 (날짜, 발췌, 메타, 재생)
    auth/AuthProvider.tsx           # Supabase Auth 컨텍스트
  lib/
    supabase/client.ts              # 브라우저용 Supabase 클라이언트
    supabase/server.ts              # 서버용 Supabase 클라이언트
    music-api.ts                    # 음악 생성 API 추상화 (Suno 구현 + mock 모드)
    types.ts                        # TypeScript 타입 정의
    constants.ts                    # 디자인 토큰, 옵션 목록 상수
    daily-limit.ts                  # 일일 생성 제한 체크 유틸
  hooks/
    use-generation-status.ts        # Supabase Realtime 구독 훅
middleware.ts                       # Next.js 미들웨어 — 인증 체크 + 리다이렉트
supabase/
  config.toml                       # Supabase CLI 설정
  migrations/
    20260409000000_initial_schema.sql  # 초기 스키마 + RLS
tailwind.config.ts                  # 디자인 토큰 기반 Tailwind 설정
vitest.config.ts                    # Vitest 설정
```

### Parallelization Map

```
Task 1 (Scaffold) ─────────────────────────────────────────────────────►
  └─► Task 2 (Supabase Schema + Clients) ─────────────────────────────►
        ├─► Task 3 (Auth)  ──────────┐
        │                            ├─► Task 5 (Diary Form Page)  ──┐
        └─► Task 4 (Layout Shell) ──┘                                │
                                                                      │
        Task 6 (Music API Backend) ──────────────────────────────────┤
                                                                      │
          ┌───────────────────────────────────────────────────────────┘
          ├─► Task 7 (Generation Page)  ─┐
          ├─► Task 8 (Result Page)       ├─► Task 10 (Polish + Limits)
          └─► Task 9 (History Page)     ─┘
```

Tasks 7, 8, 9 can run in parallel after Tasks 4+6 complete.

---

## Task 1: Project Scaffolding + Design Tokens

**Files:**
- Create: `package.json`, `tailwind.config.ts`, `src/app/globals.css`, `src/lib/constants.ts`, `vitest.config.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Create Next.js 15 project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select: No turbopack (stable), Yes to all defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom @vitejs/plugin-react
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom/vitest'
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Configure Tailwind with DESIGN.md tokens**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffe2ab',
        'primary-container': '#ffbf00',
        secondary: '#ffbe4a',
        'secondary-container': '#e6a102',
        tertiary: '#ffe396',
        'tertiary-container': '#eec540',
        surface: '#131313',
        'on-primary': '#402d00',
        'on-primary-container': '#6d5000',
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#a09a94',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1c1b1b',
        'surface-container': '#201f1f',
        'surface-container-high': '#2a2a2a',
        'surface-container-highest': '#353534',
        'surface-variant': '#353534',
        'outline-variant': '#504532',
        'status-pending': '#ffbf00',
        'status-generating': '#4fc3f7',
        'status-completed': '#66bb6a',
        'status-failed': '#ef5350',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'headline': ['1.75rem', { lineHeight: '1.3', fontWeight: '700' }],
        'body': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '500' }],
      },
      borderRadius: {
        'xl': '0.75rem',
        'lg': '0.5rem',
        'sm': '0.125rem',
      },
      boxShadow: {
        'amber': '0 10px 40px rgba(255, 191, 0, 0.06)',
        'amber-lg': '0 20px 60px rgba(255, 191, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Write global CSS**

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Tailwind v4에서는 @theme으로 토큰 등록 — tailwind.config.ts의 extend와 동기화 */
}

html {
  color-scheme: dark;
}

body {
  background-color: #131313;
  color: #e5e2e1;
  font-family: 'Manrope', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Glass morphism utility */
.glass {
  background: rgba(32, 31, 31, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Ambient shadow with amber tint */
.shadow-ambient {
  box-shadow: 0 10px 40px rgba(255, 191, 0, 0.06);
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

- [ ] **Step 6: Create design constants**

```typescript
// src/lib/constants.ts
export const MUSIC_OPTIONS = {
  genre: {
    label: '장르',
    options: ['팝', '재즈', '클래식', '일렉트로닉', '앰비언트', 'R&B', '록', '어쿠스틱', '힙합', '보사노바'],
  },
  instrument: {
    label: '주요 악기',
    options: ['피아노', '기타', '바이올린', '첼로', '신스', '드럼', '플루트', '색소폰', '우쿨렐레'],
  },
  tempo: {
    label: '템포',
    options: ['아주 느리게', '느리게', '보통', '빠르게', '아주 빠르게'],
  },
  mood: {
    label: '분위기',
    options: ['평화로운', '우울한', '신나는', '몽환적', '따뜻한', '쓸쓸한', '밝은', '긴장되는'],
  },
  texture: {
    label: '질감/특징',
    options: ['미니멀', '레이어드', '오케스트라', '로파이', '어쿠스틱', '일렉트릭', '보컬 포함', '인스트루멘탈'],
  },
} as const;

export type MusicOptionGroup = keyof typeof MUSIC_OPTIONS;

export const DAILY_GENERATION_LIMIT = 3;
export const MUSIC_DURATION_SECONDS = 30;

export const STATUS_CONFIG = {
  pending: { color: '#ffbf00', label: '대기 중' },
  generating: { color: '#4fc3f7', label: '생성 중' },
  completed: { color: '#66bb6a', label: '생성 완료' },
  failed: { color: '#ef5350', label: '생성 실패' },
} as const;

export type GenerationStatus = keyof typeof STATUS_CONFIG;
```

- [ ] **Step 7: Create .env.local.example**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUNO_API_KEY=your-suno-api-key
SUNO_API_URL=https://api.suno.ai
# Set to "true" to use mock music generation (no API key needed)
MOCK_MUSIC_API=true
```

- [ ] **Step 8: Run tests to verify setup**

```bash
npx vitest run
```

Expected: 0 tests found, no errors. Confirms vitest config is correct.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind design tokens"
```

---

## Task 2: Supabase Schema + Clients + Types

**Files:**
- Create: `supabase/migrations/20260409000000_initial_schema.sql`
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Create: `src/lib/types.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Initialize Supabase**

```bash
npx supabase init
```

This creates `supabase/config.toml`.

- [ ] **Step 2: Write initial schema migration**

```sql
-- supabase/migrations/20260409000000_initial_schema.sql

-- diary_entries: 일기 본문
create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- music_generations: 음악 생성 요청 + 결과
create table public.music_generations (
  id uuid primary key default gen_random_uuid(),
  diary_entry_id uuid references public.diary_entries(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'completed', 'failed')),
  options jsonb default '{}'::jsonb,
  audio_url text,
  title text,
  duration_seconds integer default 30,
  error_message text,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

-- 인덱스
create index idx_diary_entries_user_id on public.diary_entries(user_id);
create index idx_diary_entries_created_at on public.diary_entries(created_at desc);
create index idx_music_generations_user_id on public.music_generations(user_id);
create index idx_music_generations_diary_entry_id on public.music_generations(diary_entry_id);
create index idx_music_generations_status on public.music_generations(status);

-- RLS 활성화
alter table public.diary_entries enable row level security;
alter table public.music_generations enable row level security;

-- RLS 정책: 유저는 자기 데이터만 접근
create policy "Users can read own diary entries"
  on public.diary_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own diary entries"
  on public.diary_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can read own music generations"
  on public.music_generations for select
  using (auth.uid() = user_id);

create policy "Users can insert own music generations"
  on public.music_generations for insert
  with check (auth.uid() = user_id);

-- Service role이 status 업데이트 (API route에서 사용)
create policy "Service role can update music generations"
  on public.music_generations for update
  using (true);

-- Realtime 활성화
alter publication supabase_realtime add table public.music_generations;

-- Supabase Storage 버킷 (음악 파일)
insert into storage.buckets (id, name, public)
values ('music', 'music', true);

create policy "Anyone can read music files"
  on storage.objects for select
  using (bucket_id = 'music');

create policy "Authenticated users can upload music files"
  on storage.objects for insert
  with check (bucket_id = 'music' and auth.role() = 'authenticated');
```

- [ ] **Step 3: Create TypeScript types**

```typescript
// src/lib/types.ts
import type { GenerationStatus } from './constants'

export interface DiaryEntry {
  id: string
  user_id: string
  content: string
  created_at: string
}

export interface MusicGeneration {
  id: string
  diary_entry_id: string
  user_id: string
  status: GenerationStatus
  options: MusicOptions
  audio_url: string | null
  title: string | null
  duration_seconds: number
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface MusicOptions {
  genre?: string
  instrument?: string
  tempo?: string
  mood?: string
  texture?: string
}

/** 히스토리용: diary + generation 조인 */
export interface DiaryWithGeneration extends DiaryEntry {
  music_generations: MusicGeneration[]
}

export interface GenerationWithDiary extends MusicGeneration {
  diary_entries: DiaryEntry
}
```

- [ ] **Step 4: Create browser Supabase client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: Create server Supabase client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출 시 무시 (read-only)
          }
        },
      },
    }
  )
}

/** API route용 — service role key 사용 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}
```

- [ ] **Step 6: Create Next.js middleware for auth**

```typescript
// middleware.ts (프로젝트 루트)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 로그인 안 된 상태에서 보호된 경로 접근 → /login으로
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인 된 상태에서 /login 접근 → 메인으로
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema, clients, types, and auth middleware"
```

---

## Task 3: Authentication (Login Page + OAuth Callback)

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/components/auth/AuthProvider.tsx`

- [ ] **Step 1: Write OAuth callback route**

```typescript
// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

- [ ] **Step 2: Write AuthProvider**

```tsx
// src/components/auth/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContext {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContext>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser)
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

- [ ] **Step 3: Write login page**

참고: `stitch_ai/amber_5/code.html` (로그인 화면 목업)

```tsx
// src/app/login/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      {/* Ambient glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffbf00 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full">
        {/* App icon */}
        <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center shadow-amber">
          <span className="material-symbols-outlined text-primary-container text-4xl">music_note</span>
        </div>

        {/* App name */}
        <h1 className="text-display text-primary-container text-center">
          싱송 다이어리
        </h1>

        {/* Tagline */}
        <p className="text-body text-primary/60 text-center">
          일기를 쓰면, 음악이 됩니다
        </p>

        {/* Decorative waveform (static) */}
        <div className="flex items-end gap-1 h-8 opacity-30">
          {[40, 65, 50, 80, 45, 70, 55, 75, 40, 60].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-primary-container"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {/* Google login button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-surface-container-high rounded-xl text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="font-semibold">Google 계정으로 시작하기</span>
        </button>

        {/* Footer links */}
        <div className="flex gap-4 text-label text-on-surface-variant uppercase">
          <a href="#" className="hover:text-primary transition-colors">개인정보 처리방침</a>
          <span>·</span>
          <a href="#" className="hover:text-primary transition-colors">이용약관</a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify login flow manually**

Supabase 대시보드에서:
1. Authentication → Providers → Google 활성화
2. Google Cloud Console에서 OAuth 클라이언트 ID 생성
3. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

Run: `npm run dev` → `/login` 접속 → Google 로그인 → `/` 리다이렉트 확인

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Google OAuth login with Supabase Auth"
```

---

## Task 4: Layout Shell (Root Layout + TopBar + BottomNav)

**Files:**
- Create: `src/components/layout/TopBar.tsx`, `src/components/layout/BottomNav.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write TopBar component**

참고: `DESIGN.md` 줄 111-113

```tsx
// src/components/layout/TopBar.tsx
'use client'

import { useAuth } from '@/components/auth/AuthProvider'

export function TopBar() {
  const { user, signOut } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Avatar + App name */}
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

        {/* Right: Logout */}
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
```

- [ ] **Step 2: Write BottomNav component**

참고: `DESIGN.md` 줄 104-108

```tsx
// src/components/layout/BottomNav.tsx
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
```

- [ ] **Step 3: Update root layout**

```tsx
// src/app/layout.tsx
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

  // 로그인 페이지에서는 TopBar/BottomNav 숨김
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
```

- [ ] **Step 4: Verify layout renders correctly**

```bash
npm run dev
```

브라우저에서 확인: 상단 글래스 바 + 하단 네비게이션 + 메인 컨텐츠 영역. 모바일/데스크톱 모두 확인.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add layout shell with TopBar and BottomNav"
```

---

## Task 5: Diary Writing Page (메인)

**Files:**
- Create: `src/components/diary/MusicOptions.tsx`
- Create: `src/components/diary/DiaryForm.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/components/diary/MusicOptions.test.tsx`

- [ ] **Step 1: Write failing test for MusicOptions**

```tsx
// src/components/diary/MusicOptions.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MusicOptions } from './MusicOptions'

describe('MusicOptions', () => {
  it('renders all 5 option groups', () => {
    render(<MusicOptions selected={{}} onSelect={() => {}} />)
    expect(screen.getByText('장르')).toBeInTheDocument()
    expect(screen.getByText('주요 악기')).toBeInTheDocument()
    expect(screen.getByText('템포')).toBeInTheDocument()
    expect(screen.getByText('분위기')).toBeInTheDocument()
    expect(screen.getByText('질감/특징')).toBeInTheDocument()
  })

  it('selects one option per group (single select)', async () => {
    const user = userEvent.setup()
    let selected = {}
    const onSelect = (next: Record<string, string>) => { selected = next }

    const { rerender } = render(<MusicOptions selected={selected} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: '재즈' }))
    expect(selected).toEqual({ genre: '재즈' })

    rerender(<MusicOptions selected={selected} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: '팝' }))
    expect(selected).toEqual({ genre: '팝' })
  })

  it('deselects when clicking the same option again', async () => {
    const user = userEvent.setup()
    let selected: Record<string, string> = { genre: '재즈' }
    const onSelect = (next: Record<string, string>) => { selected = next }

    render(<MusicOptions selected={selected} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: '재즈' }))
    expect(selected).toEqual({})
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/diary/MusicOptions.test.tsx
```

Expected: FAIL — `MusicOptions` not found.

- [ ] **Step 3: Write MusicOptions component**

```tsx
// src/components/diary/MusicOptions.tsx
'use client'

import { MUSIC_OPTIONS, type MusicOptionGroup } from '@/lib/constants'
import type { MusicOptions as MusicOptionsType } from '@/lib/types'

interface Props {
  selected: Partial<MusicOptionsType>
  onSelect: (options: Partial<MusicOptionsType>) => void
}

export function MusicOptions({ selected, onSelect }: Props) {
  const handleSelect = (group: MusicOptionGroup, value: string) => {
    const next = { ...selected }
    if (next[group] === value) {
      delete next[group]
    } else {
      next[group] = value
    }
    onSelect(next)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-headline text-primary">음악 설정</h2>
      {(Object.entries(MUSIC_OPTIONS) as [MusicOptionGroup, typeof MUSIC_OPTIONS[MusicOptionGroup]][]).map(
        ([group, config]) => (
          <div key={group}>
            <span className="text-label text-on-surface-variant uppercase block mb-2">
              {config.label}
            </span>
            <div className="flex flex-wrap gap-2">
              {config.options.map((option) => {
                const isSelected = selected[group] === option
                return (
                  <button
                    key={option}
                    role="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(group, option)}
                    className={`px-3 py-1.5 rounded-sm text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        )
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/diary/MusicOptions.test.tsx
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Write DiaryForm component**

```tsx
// src/components/diary/DiaryForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MusicOptions } from './MusicOptions'
import { createClient } from '@/lib/supabase/client'
import type { MusicOptions as MusicOptionsType } from '@/lib/types'
import { DAILY_GENERATION_LIMIT } from '@/lib/constants'

interface Props {
  todayCount: number
}

export function DiaryForm({ todayCount }: Props) {
  const [content, setContent] = useState('')
  const [options, setOptions] = useState<Partial<MusicOptionsType>>({})
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const remaining = DAILY_GENERATION_LIMIT - todayCount
  const canSubmit = content.trim().length > 0 && remaining > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. diary_entry 생성
      const { data: entry, error: entryError } = await supabase
        .from('diary_entries')
        .insert({ user_id: user.id, content: content.trim() })
        .select()
        .single()

      if (entryError || !entry) throw entryError

      // 2. music_generation 생성 (status: pending)
      const { data: generation, error: genError } = await supabase
        .from('music_generations')
        .insert({
          diary_entry_id: entry.id,
          user_id: user.id,
          status: 'pending',
          options,
        })
        .select()
        .single()

      if (genError || !generation) throw genError

      // 3. 생성 페이지로 이동
      router.push(`/generation/${generation.id}`)
    } catch (error) {
      console.error('Submit failed:', error)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: Diary */}
      <div className="flex-1 lg:w-[60%] space-y-4">
        <h1 className="text-display text-primary">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
          })}
        </h1>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 하루는 어땠나요?"
          className="w-full min-h-[300px] bg-surface-container-low rounded-xl p-5 text-body text-on-surface placeholder:text-on-surface-variant/40 resize-none focus:outline-none focus:bg-surface-container focus:ring-1 focus:ring-primary/20 transition-colors"
        />
      </div>

      {/* Right: Options */}
      <div className="lg:w-[40%] space-y-6">
        <MusicOptions selected={options} onSelect={setOptions} />

        <div className="space-y-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 rounded-full font-extrabold text-on-primary-container transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, #ffbf00, #e6a102)'
                : undefined,
              backgroundColor: canSubmit ? undefined : '#353534',
            }}
          >
            {submitting ? '제출 중...' : '음악 만들기'}
          </button>

          {remaining > 0 ? (
            <p className="text-label text-on-surface-variant text-center uppercase">
              오늘 남은 횟수: {remaining}/{DAILY_GENERATION_LIMIT}
            </p>
          ) : (
            <p className="text-body text-status-failed text-center">
              오늘 횟수를 모두 사용했어요. 내일 다시 만들 수 있어요.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write main page**

```tsx
// src/app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { DiaryForm } from '@/components/diary/DiaryForm'
import { DAILY_GENERATION_LIMIT } from '@/lib/constants'

export default async function MainPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 오늘 생성 횟수 조회
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('music_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .gte('created_at', today.toISOString())

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <DiaryForm todayCount={count ?? 0} />
    </div>
  )
}
```

- [ ] **Step 7: Run tests**

```bash
npx vitest run
```

Expected: MusicOptions tests PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add diary writing page with music options"
```

---

## Task 6: Music Generation Backend

**Files:**
- Create: `src/lib/music-api.ts`
- Create: `src/lib/music-api.test.ts`
- Create: `src/app/api/generate/[id]/route.ts`
- Create: `src/lib/daily-limit.ts`
- Create: `src/lib/daily-limit.test.ts`

- [ ] **Step 1: Write failing test for daily limit**

```typescript
// src/lib/daily-limit.test.ts
import { describe, it, expect } from 'vitest'
import { canGenerate, getRemainingCount } from './daily-limit'

describe('daily-limit', () => {
  it('allows generation when count is below limit', () => {
    expect(canGenerate(0)).toBe(true)
    expect(canGenerate(1)).toBe(true)
    expect(canGenerate(2)).toBe(true)
  })

  it('blocks generation when count reaches limit', () => {
    expect(canGenerate(3)).toBe(false)
    expect(canGenerate(5)).toBe(false)
  })

  it('returns remaining count', () => {
    expect(getRemainingCount(0)).toBe(3)
    expect(getRemainingCount(2)).toBe(1)
    expect(getRemainingCount(3)).toBe(0)
    expect(getRemainingCount(5)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/daily-limit.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write daily-limit module**

```typescript
// src/lib/daily-limit.ts
import { DAILY_GENERATION_LIMIT } from './constants'

export function canGenerate(todayCount: number): boolean {
  return todayCount < DAILY_GENERATION_LIMIT
}

export function getRemainingCount(todayCount: number): number {
  return Math.max(0, DAILY_GENERATION_LIMIT - todayCount)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/daily-limit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing test for music-api**

```typescript
// src/lib/music-api.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateMusic, type MusicGenerationRequest } from './music-api'

describe('music-api (mock mode)', () => {
  it('returns audio URL and title for a valid request', async () => {
    const request: MusicGenerationRequest = {
      prompt: '오늘 하루가 정말 좋았다. 봄바람이 따뜻했다.',
      genre: '재즈',
      instrument: '피아노',
      tempo: '느리게',
      mood: '평화로운',
    }

    const result = await generateMusic(request)

    expect(result.audioUrl).toBeTruthy()
    expect(result.title).toBeTruthy()
    expect(result.durationSeconds).toBe(30)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run src/lib/music-api.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Write music-api module**

```typescript
// src/lib/music-api.ts
export interface MusicGenerationRequest {
  prompt: string
  genre?: string
  instrument?: string
  tempo?: string
  mood?: string
  texture?: string
}

export interface MusicGenerationResult {
  audioUrl: string
  title: string
  durationSeconds: number
}

const IS_MOCK = process.env.MOCK_MUSIC_API === 'true'

/**
 * 음악 생성 API 호출.
 * MOCK_MUSIC_API=true이면 2초 딜레이 후 더미 결과 반환.
 */
export async function generateMusic(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
  if (IS_MOCK) {
    return mockGenerate(request)
  }
  return sunoGenerate(request)
}

/** Mock 모드 — 개발용 */
async function mockGenerate(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const mood = request.mood ?? '잔잔한'
  const genre = request.genre ?? '팝'
  const title = `${mood} ${genre} — ${request.prompt.slice(0, 20)}...`

  return {
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title,
    durationSeconds: 30,
  }
}

/** Suno API 실제 호출 */
async function sunoGenerate(request: MusicGenerationRequest): Promise<MusicGenerationResult> {
  const apiKey = process.env.SUNO_API_KEY
  const apiUrl = process.env.SUNO_API_URL ?? 'https://api.suno.ai'

  if (!apiKey) throw new Error('SUNO_API_KEY is not set')

  // 프롬프트 구성
  const tags = [request.genre, request.instrument, request.tempo, request.mood, request.texture]
    .filter(Boolean)
    .join(', ')

  const prompt = `${request.prompt}\n\nStyle: ${tags || 'AI choice'}`

  // 1. 생성 요청
  const createRes = await fetch(`${apiUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      make_instrumental: !request.texture?.includes('보컬'),
      wait_audio: true,
    }),
  })

  if (!createRes.ok) {
    throw new Error(`Suno API error: ${createRes.status} ${await createRes.text()}`)
  }

  const data = await createRes.json()
  const clip = Array.isArray(data) ? data[0] : data

  return {
    audioUrl: clip.audio_url,
    title: clip.title ?? '무제',
    durationSeconds: 30,
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
MOCK_MUSIC_API=true npx vitest run src/lib/music-api.test.ts
```

Expected: PASS.

- [ ] **Step 9: Write API route for triggering generation**

```typescript
// src/app/api/generate/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMusic } from '@/lib/music-api'
import { canGenerate } from '@/lib/daily-limit'

export const maxDuration = 60 // Vercel function timeout

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  // 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // generation 조회 + 소유자 확인
  const { data: generation } = await supabase
    .from('music_generations')
    .select('*, diary_entries(content)')
    .eq('id', id)
    .single()

  if (!generation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 이미 처리 중이거나 완료된 경우 무시 (idempotency)
  if (generation.status !== 'pending') {
    return NextResponse.json({ status: generation.status })
  }

  // 일일 제한 체크
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('music_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())
    .neq('id', id) // 현재 요청 제외

  if (!canGenerate(count ?? 0)) {
    await serviceSupabase
      .from('music_generations')
      .update({ status: 'failed', error_message: '일일 생성 제한을 초과했습니다.' })
      .eq('id', id)
    return NextResponse.json({ error: 'Daily limit exceeded' }, { status: 429 })
  }

  // status → generating
  await serviceSupabase
    .from('music_generations')
    .update({ status: 'generating' })
    .eq('id', id)

  try {
    const diaryContent = (generation.diary_entries as { content: string }).content
    const result = await generateMusic({
      prompt: diaryContent,
      ...generation.options,
    })

    // status → completed
    await serviceSupabase
      .from('music_generations')
      .update({
        status: 'completed',
        audio_url: result.audioUrl,
        title: result.title,
        duration_seconds: result.durationSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ status: 'completed' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await serviceSupabase
      .from('music_generations')
      .update({ status: 'failed', error_message: message })
      .eq('id', id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 10: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add music generation API with Suno integration and daily limits"
```

---

## Task 7: Generation Page (생성 중 / 상태 추적)

**Files:**
- Create: `src/hooks/use-generation-status.ts`
- Create: `src/components/music/WaveformAnimation.tsx`
- Create: `src/components/music/StatusDot.tsx`
- Create: `src/app/generation/[id]/page.tsx`

- [ ] **Step 1: Write StatusDot component**

참고: `DESIGN.md` 줄 92-96

```tsx
// src/components/music/StatusDot.tsx
import { STATUS_CONFIG, type GenerationStatus } from '@/lib/constants'

interface Props {
  status: GenerationStatus
}

export function StatusDot({ status }: Props) {
  const config = STATUS_CONFIG[status]

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full inline-block"
        style={{ backgroundColor: config.color }}
      />
      <span className="text-sm text-on-surface-variant">{config.label}</span>
    </span>
  )
}
```

- [ ] **Step 2: Write WaveformAnimation component**

참고: `DESIGN.md` 줄 139 — CSS 사운드 바, 위아래 높이 변화

```tsx
// src/components/music/WaveformAnimation.tsx
export function WaveformAnimation() {
  return (
    <div className="flex items-end justify-center gap-1.5 h-16" aria-label="음악 생성 중">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-primary-container"
          style={{
            animation: `waveform 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
            height: '20%',
          }}
        />
      ))}
      <style>{`
        @keyframes waveform {
          0%, 100% { height: 20%; opacity: 0.4; }
          50% { height: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 3: Write useGenerationStatus hook**

```typescript
// src/hooks/use-generation-status.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GenerationWithDiary } from '@/lib/types'

export function useGenerationStatus(generationId: string) {
  const [generation, setGeneration] = useState<GenerationWithDiary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // 초기 로드
    const fetchGeneration = async () => {
      const { data } = await supabase
        .from('music_generations')
        .select('*, diary_entries(*)')
        .eq('id', generationId)
        .single()

      if (data) setGeneration(data as GenerationWithDiary)
      setLoading(false)
    }

    fetchGeneration()

    // Realtime 구독
    const channel = supabase
      .channel(`generation-${generationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'music_generations',
          filter: `id=eq.${generationId}`,
        },
        (payload) => {
          setGeneration((prev) =>
            prev ? { ...prev, ...payload.new } as GenerationWithDiary : null
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [generationId])

  return { generation, loading }
}
```

- [ ] **Step 4: Write generation page**

참고: `stitch_ai/amber_1/code.html` (생성 중 화면 목업)

```tsx
// src/app/generation/[id]/page.tsx
'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGenerationStatus } from '@/hooks/use-generation-status'
import { WaveformAnimation } from '@/components/music/WaveformAnimation'
import { StatusDot } from '@/components/music/StatusDot'

export default function GenerationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { generation, loading } = useGenerationStatus(id)

  // 생성 트리거 (fire-and-forget)
  useEffect(() => {
    fetch(`/api/generate/${id}`, { method: 'POST' })
  }, [id])

  // 완료/실패 시 결과 페이지로 자동 이동하지 않음 — 같은 페이지에서 렌더링
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <WaveformAnimation />
      </div>
    )
  }

  if (!generation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-body text-on-surface-variant">생성 요청을 찾을 수 없어요.</p>
        <button onClick={() => router.push('/')} className="mt-4 text-primary hover:underline">
          돌아가기
        </button>
      </div>
    )
  }

  const { status } = generation

  // pending / generating → 로딩 화면
  if (status === 'pending' || status === 'generating') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-8">
        <WaveformAnimation />

        <div className="text-center space-y-3">
          <h1 className="text-headline text-primary-container">
            음악을 만들고 있어요...
          </h1>
          <StatusDot status={status} />
        </div>

        {/* 일기 카드 (읽기 전용) */}
        <div className="w-full bg-surface-container-low rounded-xl p-5 border-l-4 border-primary-container">
          <p className="text-body text-on-surface italic">
            {generation.diary_entries.content}
          </p>
        </div>

        {/* 선택한 옵션 태그 */}
        {generation.options && Object.keys(generation.options).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.values(generation.options).map((value) => (
              <span
                key={value as string}
                className="px-3 py-1 bg-surface-container-highest rounded-sm text-sm text-on-surface-variant"
              >
                {value as string}
              </span>
            ))}
          </div>
        )}

        <p className="text-label text-on-surface-variant uppercase">
          보통 20~30초 정도 걸려요
        </p>

        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-surface-container-highest text-primary rounded-xl hover:bg-surface-variant transition-colors"
        >
          생성 취소
        </button>
      </div>
    )
  }

  // completed → Task 8에서 완성할 결과 화면으로 리다이렉트
  if (status === 'completed') {
    router.replace(`/generation/${id}`)
    // Task 8에서 이 분기를 완성된 결과 UI로 교체
  }

  // failed
  if (status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-8">
        <div className="text-center space-y-3">
          <StatusDot status="failed" />
          <h1 className="text-headline text-on-surface">
            음악 생성에 실패했어요
          </h1>
          {generation.error_message && (
            <p className="text-body text-on-surface-variant">{generation.error_message}</p>
          )}
        </div>

        <div className="w-full bg-surface-container-low rounded-xl p-5 border-l-4 border-primary-container">
          <p className="text-body text-on-surface italic">
            {generation.diary_entries.content}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fetch(`/api/generate/${id}`, { method: 'POST' }).then(() => window.location.reload())}
            className="px-6 py-3 rounded-full font-extrabold text-on-primary-container"
            style={{ background: 'linear-gradient(135deg, #ffbf00, #e6a102)' }}
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-surface-container-highest text-primary rounded-xl hover:bg-surface-variant transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add generation status page with realtime tracking"
```

---

## Task 8: Result Page (생성 완료 + Music Player)

**Files:**
- Create: `src/components/music/MusicPlayer.tsx`
- Create: `src/components/diary/DiaryCard.tsx`
- Modify: `src/app/generation/[id]/page.tsx` — completed 상태 UI 완성

- [ ] **Step 1: Write DiaryCard component**

```tsx
// src/components/diary/DiaryCard.tsx
interface Props {
  content: string
  date?: string
}

export function DiaryCard({ content, date }: Props) {
  return (
    <div className="w-full bg-surface-container-low rounded-xl p-5 border-l-4 border-primary-container">
      {date && (
        <p className="text-label text-primary/60 uppercase mb-2">
          {new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
          })}
        </p>
      )}
      <p className="text-body text-on-surface italic whitespace-pre-wrap">{content}</p>
    </div>
  )
}
```

- [ ] **Step 2: Write MusicPlayer component**

참고: `DESIGN.md` 줄 80-85, `stitch_ai/amber_3/code.html` (생성 완료 목업)

```tsx
// src/components/music/MusicPlayer.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import { MUSIC_DURATION_SECONDS } from '@/lib/constants'

interface Props {
  audioUrl: string
  title: string
}

export function MusicPlayer({ audioUrl, title }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(MUSIC_DURATION_SECONDS)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration || MUSIC_DURATION_SECONDS)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = x / rect.width
    audio.currentTime = ratio * duration
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="w-full bg-surface-container rounded-xl p-6 shadow-amber space-y-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Title */}
      <p className="text-headline text-primary truncate">{title}</p>

      {/* Waveform progress bar */}
      <div className="relative cursor-pointer" onClick={handleSeek}>
        <div className="flex items-end gap-0.5 h-12">
          {Array.from({ length: 48 }).map((_, i) => {
            const barProgress = (i / 48) * 100
            const height = 30 + Math.sin(i * 0.5) * 40 + Math.random() * 30
            const isPlayed = barProgress <= progress

            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors"
                style={{
                  height: `${Math.min(100, height)}%`,
                  backgroundColor: isPlayed ? '#ffbf00' : '#353534',
                  boxShadow: isPlayed ? '0 0 6px rgba(255, 191, 0, 0.3)' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-label text-on-surface-variant">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center shadow-amber hover:shadow-amber-lg transition-shadow"
          aria-label={playing ? '일시정지' : '재생'}
        >
          <span className="material-symbols-outlined text-on-primary-container text-2xl">
            {playing ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <a
          href={audioUrl}
          download
          className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-primary transition-colors"
          aria-label="다운로드"
        >
          <span className="material-symbols-outlined">download</span>
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update generation page — completed state**

`src/app/generation/[id]/page.tsx`의 `status === 'completed'` 분기를 다음으로 교체:

```tsx
// completed 상태일 때 (기존 router.replace 부분을 교체)
if (status === 'completed' && generation.audio_url && generation.title) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-8">
      <div className="text-center space-y-3">
        <h1 className="text-headline text-primary">
          당신의 일기가 노래가 되었습니다
        </h1>
        <StatusDot status="completed" />
      </div>

      <MusicPlayer audioUrl={generation.audio_url} title={generation.title} />

      <DiaryCard
        content={generation.diary_entries.content}
        date={generation.diary_entries.created_at}
      />

      {generation.options && Object.keys(generation.options).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.values(generation.options).map((value) => (
            <span
              key={value as string}
              className="px-3 py-1 bg-surface-container-highest rounded-sm text-sm text-on-surface-variant"
            >
              {value as string}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3 w-full">
        <button
          onClick={() => {
            // TODO: 같은 일기 텍스트 유지하면서 메인으로 (query param)
            router.push(`/?diary=${generation.diary_entry_id}`)
          }}
          className="flex-1 px-6 py-3 bg-surface-container-highest text-primary rounded-xl hover:bg-surface-variant transition-colors text-center"
        >
          다른 스타일로 다시 만들기
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex-1 px-6 py-3 rounded-full font-extrabold text-on-primary-container text-center"
          style={{ background: 'linear-gradient(135deg, #ffbf00, #e6a102)' }}
        >
          새 일기 쓰기
        </button>
      </div>
    </div>
  )
}
```

필요한 import 추가:

```tsx
import { MusicPlayer } from '@/components/music/MusicPlayer'
import { DiaryCard } from '@/components/diary/DiaryCard'
```

- [ ] **Step 4: Verify visually**

```bash
npm run dev
```

Mock 모드로 전체 플로우 테스트: 일기 작성 → 제출 → 생성 중 → 완료 → 플레이어 재생.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add music player and generation result page"
```

---

## Task 9: History Page (지난 기록)

**Files:**
- Create: `src/components/history/HistoryCard.tsx`
- Create: `src/app/history/page.tsx`

- [ ] **Step 1: Write HistoryCard component**

참고: `DESIGN.md` 줄 163-173, `stitch_ai/amber_2/code.html` (히스토리 목업)

```tsx
// src/components/history/HistoryCard.tsx
'use client'

import { useRef, useState } from 'react'
import type { GenerationWithDiary } from '@/lib/types'

interface Props {
  generation: GenerationWithDiary
  variant: 'low' | 'lowest'
  onClick: () => void
}

export function HistoryCard({ generation, variant, onClick }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  const bgClass = variant === 'low' ? 'bg-surface-container-low' : 'bg-surface-container-lowest'
  const diary = generation.diary_entries

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio || !generation.audio_url) return

    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  return (
    <div
      onClick={onClick}
      className={`${bgClass} rounded-xl p-5 cursor-pointer hover:bg-surface-container transition-colors group`}
    >
      {generation.audio_url && (
        <audio
          ref={audioRef}
          src={generation.audio_url}
          preload="none"
          onEnded={() => setPlaying(false)}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Date */}
          <p className="text-label text-primary/60 uppercase">
            {new Date(diary.created_at).toLocaleDateString('ko-KR', {
              month: 'long', day: 'numeric', weekday: 'long',
            })}
          </p>

          {/* Title / excerpt */}
          <p className="text-headline text-primary truncate">
            {generation.title ?? diary.content.slice(0, 30)}
          </p>

          {/* Diary excerpt */}
          <p className="text-body text-on-surface-variant italic line-clamp-2">
            {diary.content}
          </p>

          {/* Mini waveform + metadata */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-end gap-px h-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-primary-container/40"
                  style={{ height: `${30 + Math.sin(i * 0.7) * 50 + 20}%` }}
                />
              ))}
            </div>
            {generation.duration_seconds && (
              <span className="text-label text-on-surface-variant uppercase">
                0:{generation.duration_seconds.toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {/* Play button */}
        {generation.audio_url && (
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shadow-amber shrink-0"
            aria-label={playing ? '일시정지' : '재생'}
          >
            <span className="material-symbols-outlined text-on-primary-container">
              {playing ? 'pause' : 'play_arrow'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write history page**

```tsx
// src/app/history/page.tsx
import { createClient } from '@/lib/supabase/server'
import { HistoryList } from './history-list'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: generations } = await supabase
    .from('music_generations')
    .select('*, diary_entries(*)')
    .eq('user_id', user!.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-display text-primary mb-8">지난 기록</h1>
      <HistoryList generations={generations ?? []} />
    </div>
  )
}
```

```tsx
// src/app/history/history-list.tsx
'use client'

import { useRouter } from 'next/navigation'
import { HistoryCard } from '@/components/history/HistoryCard'
import type { GenerationWithDiary } from '@/lib/types'

interface Props {
  generations: GenerationWithDiary[]
}

export function HistoryList({ generations }: Props) {
  const router = useRouter()

  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-body text-on-surface-variant">
          아직 기록이 없어요. 첫 번째 일기를 써보세요!
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-full font-extrabold text-on-primary-container"
          style={{ background: 'linear-gradient(135deg, #ffbf00, #e6a102)' }}
        >
          일기 쓰러 가기
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {generations.map((gen, i) => (
        <HistoryCard
          key={gen.id}
          generation={gen}
          variant={i % 2 === 0 ? 'low' : 'lowest'}
          onClick={() => router.push(`/generation/${gen.id}`)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify history page**

```bash
npm run dev
```

`/history` 접속 → 빈 상태 확인 → 음악 생성 후 히스토리 노출 확인.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add history page with diary card list"
```

---

## Task 10: Polish + Responsive + Edge Cases

**Files:**
- Modify: `src/app/page.tsx` — "다른 스타일로 다시 만들기" 지원
- Modify: `src/components/diary/DiaryForm.tsx` — 기존 일기 텍스트 복원
- Modify: `src/app/layout.tsx` — 로그인 페이지에서 레이아웃 조건부 렌더링 개선
- General: 반응형 테스트 + 접근성 점검

- [ ] **Step 1: Support "다른 스타일로 다시 만들기" flow**

`src/app/page.tsx` 수정 — query param으로 전달된 diary_entry_id의 내용을 미리 채워줌:

```tsx
// src/app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { DiaryForm } from '@/components/diary/DiaryForm'

interface Props {
  searchParams: Promise<{ diary?: string }>
}

export default async function MainPage({ searchParams }: Props) {
  const { diary: diaryId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 오늘 생성 횟수
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('music_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .gte('created_at', today.toISOString())

  // "다른 스타일로 다시 만들기"에서 넘어온 경우 기존 일기 내용 조회
  let initialContent = ''
  if (diaryId) {
    const { data: entry } = await supabase
      .from('diary_entries')
      .select('content')
      .eq('id', diaryId)
      .single()
    initialContent = entry?.content ?? ''
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <DiaryForm todayCount={count ?? 0} initialContent={initialContent} />
    </div>
  )
}
```

`src/components/diary/DiaryForm.tsx` 수정 — `initialContent` prop 추가:

```tsx
// DiaryForm props 변경
interface Props {
  todayCount: number
  initialContent?: string
}

export function DiaryForm({ todayCount, initialContent = '' }: Props) {
  const [content, setContent] = useState(initialContent)
  // ... 나머지 동일
}
```

- [ ] **Step 2: Test the retry flow**

```bash
npm run dev
```

일기 작성 → 생성 완료 → "다른 스타일로 다시 만들기" 클릭 → 메인에서 기존 텍스트 유지 확인 → 옵션 변경 → 재생성.

- [ ] **Step 3: Responsive check**

모바일(375px), 태블릿(768px), 데스크톱(1024px+) 에서 확인:
- 메인: 모바일은 세로 배치, 데스크톱은 2컬럼
- 히스토리: 카드 리스트 정상 렌더링
- 플레이어: 터치 영역 충분한지 확인 (최소 44px)
- TopBar/BottomNav: 글래스 효과 + 고정 위치

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add retry flow, responsive polish, and edge case handling"
```

---

## Deployment Checklist (수동)

구현 완료 후:

1. **Supabase 설정:**
   - Migration 적용: `npx supabase db push`
   - Google OAuth provider 활성화
   - Realtime 활성화 확인

2. **Vercel 배포:**
   - GitHub repo 연결
   - 환경 변수 설정 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUNO_API_KEY)
   - `MOCK_MUSIC_API=false` (프로덕션)

3. **도메인 설정 후:**
   - Supabase Auth redirect URL 업데이트
   - Google OAuth redirect URI 업데이트
