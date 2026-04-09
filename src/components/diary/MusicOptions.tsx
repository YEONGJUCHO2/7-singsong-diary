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
