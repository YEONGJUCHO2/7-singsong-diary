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

-- RLS 정책
create policy "Users can read own diary entries"
  on public.diary_entries for select using (auth.uid() = user_id);

create policy "Users can insert own diary entries"
  on public.diary_entries for insert with check (auth.uid() = user_id);

create policy "Users can read own music generations"
  on public.music_generations for select using (auth.uid() = user_id);

create policy "Users can insert own music generations"
  on public.music_generations for insert with check (auth.uid() = user_id);

create policy "Service role can update music generations"
  on public.music_generations for update using (true);

-- Realtime
alter publication supabase_realtime add table public.music_generations;

-- Storage bucket
insert into storage.buckets (id, name, public) values ('music', 'music', true);

create policy "Anyone can read music files"
  on storage.objects for select using (bucket_id = 'music');

create policy "Authenticated users can upload music files"
  on storage.objects for insert with check (bucket_id = 'music' and auth.role() = 'authenticated');
