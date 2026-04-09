'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MusicOptions } from './MusicOptions'
import { createClient } from '@/lib/supabase/client'
import type { MusicOptions as MusicOptionsType } from '@/lib/types'
import { DAILY_GENERATION_LIMIT } from '@/lib/constants'

interface Props {
  todayCount: number
  initialContent?: string
}

export function DiaryForm({ todayCount, initialContent = '' }: Props) {
  const [content, setContent] = useState(initialContent)
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

      const { data: entry, error: entryError } = await supabase
        .from('diary_entries')
        .insert({ user_id: user.id, content: content.trim() })
        .select()
        .single()

      if (entryError || !entry) throw entryError

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

      router.push(`/generation/${generation.id}`)
    } catch (error) {
      console.error('Submit failed:', error)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
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
