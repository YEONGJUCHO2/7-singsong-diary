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

      <p className="text-headline text-primary truncate">{title}</p>

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
