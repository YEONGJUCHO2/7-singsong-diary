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

export interface DiaryWithGeneration extends DiaryEntry {
  music_generations: MusicGeneration[]
}

export interface GenerationWithDiary extends MusicGeneration {
  diary_entries: DiaryEntry
}
