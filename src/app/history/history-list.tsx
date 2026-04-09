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
