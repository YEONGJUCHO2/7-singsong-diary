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
          <p className="text-label text-primary/60 uppercase">
            {new Date(diary.created_at).toLocaleDateString('ko-KR', {
              month: 'long', day: 'numeric', weekday: 'long',
            })}
          </p>

          <p className="text-headline text-primary truncate">
            {generation.title ?? diary.content.slice(0, 30)}
          </p>

          <p className="text-body text-on-surface-variant italic line-clamp-2">
            {diary.content}
          </p>

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
